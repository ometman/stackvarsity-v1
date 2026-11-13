import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTokenFindUnique = vi.fn();
const mockTokenUpdateMany = vi.fn();
const mockTokenCreate = vi.fn();
const mockUserFindUnique = vi.fn();
const mockUserUpdate = vi.fn();
const mockAuditCreate = vi.fn();

const mockTx = {
  emailVerificationToken: {
    updateMany: mockTokenUpdateMany,
    create: mockTokenCreate,
  },
  user: {
    update: mockUserUpdate,
  },
};

vi.mock("@/server/db", () => ({
  getDb: () => ({
    emailVerificationToken: {
      findUnique: mockTokenFindUnique,
      updateMany: mockTokenUpdateMany,
      create: mockTokenCreate,
    },
    user: {
      findUnique: mockUserFindUnique,
      update: mockUserUpdate,
    },
    securityAuditEvent: {
      create: mockAuditCreate,
    },
    $transaction: async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
  }),
}));

vi.mock("@/server/mail", () => ({
  getAppBaseUrl: () => "http://localhost:3000",
  sendTransactionalEmail: vi.fn().mockResolvedValue({ delivered: true, provider: "local-capture" }),
}));

import { POST as resendPost } from "@/app/api/auth/resend-verification/route";
import { hashToken } from "@/modules/auth/tokens";
import {
  issueVerificationTokenAndSendEmail,
  resendVerificationEmail,
  verifyEmailWithToken,
} from "@/modules/auth/verification-service";
import { sendTransactionalEmail } from "@/server/mail";
import { getRateLimiter } from "@/server/rate-limit";

describe("Email verification workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRateLimiter().clearAll();
  });

  it("stores only tokenHash in the database and sends the verification link", async () => {
    await issueVerificationTokenAndSendEmail({
      userId: "u1",
      email: "student@example.com",
      name: "Student",
    });

    expect(mockTokenCreate).toHaveBeenCalledTimes(1);
    const createdData = mockTokenCreate.mock.calls[0][0].data;
    expect(createdData.tokenHash).toMatch(/^[a-f0-9]{64}$/);

    const mailCall = vi.mocked(sendTransactionalEmail).mock.calls[0][0];
    const tokenMatch = mailCall.text.match(/token=([^\s]+)/);
    expect(tokenMatch).not.toBeNull();
    const rawToken = decodeURIComponent(tokenMatch![1]);
    expect(createdData.tokenHash).toBe(hashToken(rawToken));
    expect(createdData.tokenHash).not.toBe(rawToken);
  });

  it("verifies a valid single-use token and marks the user emailVerified", async () => {
    const rawToken = "a-very-secure-opaque-token-123456";
    mockTokenFindUnique.mockResolvedValueOnce({
      id: "vt1",
      userId: "u1",
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      user: { id: "u1", status: "ACTIVE", deletedAt: null },
    });
    mockTokenUpdateMany.mockResolvedValueOnce({ count: 1 });

    const result = await verifyEmailWithToken({ token: rawToken });
    expect(result.status).toBe("VERIFIED");
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { emailVerified: expect.any(Date) },
    });
  });

  it("rejects expired and replayed tokens", async () => {
    mockTokenFindUnique.mockResolvedValueOnce({
      id: "vt_expired",
      userId: "u1",
      expiresAt: new Date(Date.now() - 10_000),
      consumedAt: null,
      user: { id: "u1", status: "ACTIVE", deletedAt: null },
    });

    const expired = await verifyEmailWithToken({ token: "expired-token-1234567890" });
    expect(expired.status).toBe("EXPIRED");

    mockTokenFindUnique.mockResolvedValueOnce({
      id: "vt_used",
      userId: "u1",
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: new Date(),
      user: { id: "u1", status: "ACTIVE", deletedAt: null },
    });

    const replayed = await verifyEmailWithToken({ token: "used-token-123456789012" });
    expect(replayed.status).toBe("INVALID");
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("handles concurrent verification attempts atomically", async () => {
    mockTokenFindUnique.mockResolvedValue({
      id: "vt_race",
      userId: "u1",
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      user: { id: "u1", status: "ACTIVE", deletedAt: null },
    });
    mockTokenUpdateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });

    const [first, second] = await Promise.all([
      verifyEmailWithToken({ token: "concurrent-token-123456" }),
      verifyEmailWithToken({ token: "concurrent-token-123456" }),
    ]);

    expect([first.status, second.status].sort()).toEqual(["INVALID", "VERIFIED"]);
    expect(mockUserUpdate).toHaveBeenCalledTimes(1);
  });

  it("prevents account enumeration and rate-limits resend requests", async () => {
    mockUserFindUnique.mockResolvedValueOnce(null);
    await expect(
      resendVerificationEmail({ email: "unknown@example.com" })
    ).resolves.toBeUndefined();
    expect(sendTransactionalEmail).not.toHaveBeenCalled();

    for (let i = 0; i < 3; i += 1) {
      mockUserFindUnique.mockResolvedValueOnce(null);
      const req = new NextRequest("http://localhost:3000/api/auth/resend-verification", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.10" },
        body: JSON.stringify({ email: "unknown@example.com" }),
      });
      const res = await resendPost(req);
      expect(res.status).toBe(200);
    }

    const blockedReq = new NextRequest("http://localhost:3000/api/auth/resend-verification", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.10" },
      body: JSON.stringify({ email: "unknown@example.com" }),
    });
    const blockedRes = await resendPost(blockedReq);
    expect(blockedRes.status).toBe(429);
  });
});
