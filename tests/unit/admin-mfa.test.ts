import { NextRequest } from "next/server";
import * as OTPAuth from "otpauth";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetCurrentSession, mockMarkSessionMfaVerified } = vi.hoisted(() => ({
  mockGetCurrentSession: vi.fn(),
  mockMarkSessionMfaVerified: vi.fn(),
}));

const mockFactorFindUnique = vi.fn();
const mockFactorUpsert = vi.fn();
const mockFactorUpdate = vi.fn();
const mockFactorUpdateMany = vi.fn();
const mockRecoveryFindFirst = vi.fn();
const mockRecoveryDeleteMany = vi.fn();
const mockRecoveryCreateMany = vi.fn();
const mockRecoveryUpdateMany = vi.fn();
const mockUserFindUnique = vi.fn();
const mockUserUpdate = vi.fn();
const mockSessionDeleteMany = vi.fn();
const mockAuditCreate = vi.fn();

const mockTx = {
  adminMfaFactor: { update: mockFactorUpdate },
  user: { update: mockUserUpdate },
  mfaRecoveryCode: { deleteMany: mockRecoveryDeleteMany, createMany: mockRecoveryCreateMany },
  session: { deleteMany: mockSessionDeleteMany },
};

vi.mock("@/modules/auth/server-auth", () => ({
  getCurrentSession: mockGetCurrentSession,
  requireAuth: async () => {
    const session = await mockGetCurrentSession();
    if (!session) {
      const { UnauthorizedError } = await import("@/modules/auth/errors");
      throw new UnauthorizedError();
    }
    return session;
  },
}));

vi.mock("@/modules/auth/session-repository", async () => ({
  markSessionMfaVerified: mockMarkSessionMfaVerified,
}));

vi.mock("@/server/db", () => ({
  getDb: () => ({
    adminMfaFactor: {
      findUnique: mockFactorFindUnique,
      upsert: mockFactorUpsert,
      update: mockFactorUpdate,
      updateMany: mockFactorUpdateMany,
    },
    mfaRecoveryCode: {
      findFirst: mockRecoveryFindFirst,
      deleteMany: mockRecoveryDeleteMany,
      createMany: mockRecoveryCreateMany,
      updateMany: mockRecoveryUpdateMany,
    },
    user: {
      findUnique: mockUserFindUnique,
      update: mockUserUpdate,
    },
    session: {
      deleteMany: mockSessionDeleteMany,
    },
    securityAuditEvent: {
      create: mockAuditCreate,
    },
    $transaction: async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
  }),
}));

import { POST as mfaVerifyPost } from "@/app/api/admin/mfa/verify/route";
import { setUserAccountStatus } from "@/modules/administration/account-status-service";
import { ValidationError } from "@/modules/auth/errors";
import { decryptMfaSecret, encryptMfaSecret, hashRecoveryCode } from "@/modules/auth/mfa-crypto";
import {
  activateAdminMfa,
  beginAdminMfaEnrollment,
  verifyAdminMfaChallenge,
} from "@/modules/auth/mfa-service";
import { getRateLimiter } from "@/server/rate-limit";

function makeAdminSession(mfaEnabled = false, mfaVerifiedAt: Date | null = null) {
  return {
    id: "sess_admin",
    sessionToken: "tok_admin",
    expires: new Date(Date.now() + 60_000),
    mfaVerifiedAt,
    user: {
      id: "admin_1",
      name: "Admin",
      email: "admin@mystackvarsity.com",
      role: "ADMIN" as const,
      status: "ACTIVE" as const,
      emailVerified: new Date(),
      mfaEnabled,
    },
  };
}

describe("Administrator MFA and security hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRateLimiter().clearAll();
    process.env.AUTH_SECRET = "a-very-long-test-auth-secret-at-least-32-chars";
  });

  it("encrypts and decrypts TOTP secrets with AES-256-GCM", () => {
    const secret = new OTPAuth.Secret({ size: 20 }).base32;
    const encrypted = encryptMfaSecret(secret);
    expect(encrypted).not.toContain(secret);
    expect(decryptMfaSecret(encrypted)).toBe(secret);
  });

  it("enrolls and activates Admin MFA with TOTP and single-use recovery codes", async () => {
    mockGetCurrentSession.mockResolvedValue(makeAdminSession(false, null));
    mockFactorUpsert.mockResolvedValueOnce({});

    const enrollment = await beginAdminMfaEnrollment();
    expect(enrollment.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(enrollment.otpauthUri).toContain("otpauth://totp/");

    const encryptedStored = mockFactorUpsert.mock.calls[0][0].create.encryptedSecret;
    const validTotp = new OTPAuth.TOTP({
      issuer: "Stack Varsity",
      label: "admin@mystackvarsity.com",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(enrollment.manualSecret),
    }).generate();

    mockFactorFindUnique.mockResolvedValueOnce({
      id: "mfa_1",
      userId: "admin_1",
      encryptedSecret: encryptedStored,
      verifiedAt: null,
      lastUsedStep: null,
    });

    const activated = await activateAdminMfa({ code: validTotp });
    expect(activated.recoveryCodes).toHaveLength(10);
    expect(mockMarkSessionMfaVerified).toHaveBeenCalledWith("tok_admin");
  });

  it("blocks invalid and replayed TOTP codes", async () => {
    const secret = new OTPAuth.Secret({ size: 20 }).base32;
    const encrypted = encryptMfaSecret(secret);
    const currentStep = BigInt(Math.floor(Date.now() / 1000 / 30));
    const validTotp = new OTPAuth.TOTP({
      issuer: "Stack Varsity",
      label: "admin@mystackvarsity.com",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    }).generate();

    mockGetCurrentSession.mockResolvedValue(makeAdminSession(true, null));

    mockFactorFindUnique.mockResolvedValueOnce({
      id: "mfa_1",
      userId: "admin_1",
      encryptedSecret: encrypted,
      verifiedAt: new Date(),
      lastUsedStep: null,
    });
    await expect(verifyAdminMfaChallenge({ code: "000000" })).rejects.toBeInstanceOf(
      ValidationError
    );

    mockFactorFindUnique.mockResolvedValueOnce({
      id: "mfa_1",
      userId: "admin_1",
      encryptedSecret: encrypted,
      verifiedAt: new Date(),
      lastUsedStep: currentStep,
    });
    await expect(verifyAdminMfaChallenge({ code: validTotp })).rejects.toBeInstanceOf(
      ValidationError
    );
  });

  it("allows single-use recovery codes and blocks replay", async () => {
    mockGetCurrentSession.mockResolvedValue(makeAdminSession(true, null));
    const code = "ABCD-1234-EFGH";

    mockRecoveryFindFirst.mockResolvedValueOnce({
      id: "rc_1",
      codeHash: hashRecoveryCode(code),
    });
    mockRecoveryUpdateMany.mockResolvedValueOnce({ count: 1 });

    const ok = await verifyAdminMfaChallenge({ code });
    expect(ok.method).toBe("RECOVERY_CODE");
    expect(mockMarkSessionMfaVerified).toHaveBeenCalledWith("tok_admin");

    mockRecoveryFindFirst.mockResolvedValueOnce(null);
    await expect(verifyAdminMfaChallenge({ code })).rejects.toBeInstanceOf(ValidationError);
  });

  it("rate-limits MFA verification attempts", async () => {
    mockGetCurrentSession.mockResolvedValue(makeAdminSession(true, null));
    for (let i = 0; i < 5; i += 1) {
      mockFactorFindUnique.mockResolvedValueOnce(null);
      const res = await mfaVerifyPost(
        new NextRequest("http://localhost:3000/api/admin/mfa/verify", {
          method: "POST",
          headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.5" },
          body: JSON.stringify({ code: "123456" }),
        })
      );
      expect(res.status).toBe(400);
    }

    const blocked = await mfaVerifyPost(
      new NextRequest("http://localhost:3000/api/admin/mfa/verify", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.5" },
        body: JSON.stringify({ code: "123456" }),
      })
    );
    expect(blocked.status).toBe(429);
  });

  it("revokes all sessions immediately when suspending an account", async () => {
    mockGetCurrentSession.mockResolvedValueOnce(makeAdminSession(true, new Date()));
    mockUserFindUnique.mockResolvedValueOnce({
      id: "student_1",
      status: "ACTIVE",
      deletedAt: null,
    });

    const result = await setUserAccountStatus({
      targetUserId: "student_1",
      status: "SUSPENDED",
      reason: "Policy violation",
    });

    expect(result.newStatus).toBe("SUSPENDED");
    expect(mockSessionDeleteMany).toHaveBeenCalledWith({
      where: { userId: "student_1" },
    });
  });
});
