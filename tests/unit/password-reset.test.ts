import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUserFindUnique = vi.fn();
const mockUserUpdate = vi.fn();
const mockResetFindUnique = vi.fn();
const mockResetUpdateMany = vi.fn();
const mockResetCreate = vi.fn();
const mockSessionDeleteMany = vi.fn();
const mockAuditCreate = vi.fn();

const mockTx = {
  passwordResetToken: {
    updateMany: mockResetUpdateMany,
    create: mockResetCreate,
  },
  user: {
    update: mockUserUpdate,
  },
  session: {
    deleteMany: mockSessionDeleteMany,
  },
};

vi.mock("@/server/db", () => ({
  getDb: () => ({
    user: {
      findUnique: mockUserFindUnique,
      update: mockUserUpdate,
    },
    passwordResetToken: {
      findUnique: mockResetFindUnique,
      updateMany: mockResetUpdateMany,
      create: mockResetCreate,
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

vi.mock("@/server/mail", () => ({
  getAppBaseUrl: () => "http://localhost:3000",
  sendTransactionalEmail: vi.fn().mockResolvedValue({ delivered: true, provider: "local-capture" }),
}));

import { POST as forgotPost } from "@/app/api/auth/forgot-password/route";
import { ValidationError } from "@/modules/auth/errors";
import { completePasswordReset, requestPasswordReset } from "@/modules/auth/password-reset-service";
import { hashToken } from "@/modules/auth/tokens";
import { sendTransactionalEmail } from "@/server/mail";
import { getRateLimiter } from "@/server/rate-limit";

describe("Password recovery workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRateLimiter().clearAll();
  });

  it("does not disclose unknown emails and rate-limits forgot-password requests", async () => {
    mockUserFindUnique.mockResolvedValueOnce(null);
    await expect(requestPasswordReset({ email: "unknown@example.com" })).resolves.toBeUndefined();
    expect(sendTransactionalEmail).not.toHaveBeenCalled();

    for (let i = 0; i < 3; i += 1) {
      mockUserFindUnique.mockResolvedValueOnce(null);
      const res = await forgotPost(
        new NextRequest("http://localhost:3000/api/auth/forgot-password", {
          method: "POST",
          headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.77" },
          body: JSON.stringify({ email: "unknown@example.com" }),
        })
      );
      expect(res.status).toBe(200);
    }

    const blocked = await forgotPost(
      new NextRequest("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.77" },
        body: JSON.stringify({ email: "unknown@example.com" }),
      })
    );
    expect(blocked.status).toBe(429);
  });

  it("stores hashed reset token and completes valid reset while invalidating all sessions", async () => {
    mockUserFindUnique.mockResolvedValueOnce({
      id: "u1",
      name: "Ada",
      email: "ada@example.com",
      status: "ACTIVE",
      deletedAt: null,
    });

    await requestPasswordReset({ email: "ada@example.com" });
    const createdHash = mockResetCreate.mock.calls[0][0].data.tokenHash;
    const mailText = vi.mocked(sendTransactionalEmail).mock.calls[0][0].text;
    const rawToken = decodeURIComponent(mailText.match(/token=([^\s]+)/)![1]);
    expect(createdHash).toBe(hashToken(rawToken));
    expect(createdHash).not.toBe(rawToken);

    mockResetFindUnique.mockResolvedValueOnce({
      id: "prt1",
      userId: "u1",
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      user: {
        id: "u1",
        name: "Ada",
        email: "ada@example.com",
        status: "ACTIVE",
        deletedAt: null,
      },
    });
    mockResetUpdateMany.mockResolvedValueOnce({ count: 1 });

    const newPassword = "NewStrongPassword!2026";
    await completePasswordReset({
      token: rawToken,
      password: newPassword,
      confirmPassword: newPassword,
    });

    expect(mockUserUpdate).toHaveBeenCalledTimes(1);
    const updatedPasswordHash = mockUserUpdate.mock.calls[0][0].data.passwordHash;
    expect(updatedPasswordHash).toMatch(/^\$argon2id\$/);
    expect(updatedPasswordHash).not.toContain(newPassword);

    expect(mockSessionDeleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });

    const notificationEmail = vi.mocked(sendTransactionalEmail).mock.calls[1][0];
    expect(notificationEmail.text).not.toContain(newPassword);
    expect(notificationEmail.html).not.toContain(newPassword);
  });

  it("rejects invalid, expired, reused, weak-password, and concurrent reset attempts", async () => {
    await expect(
      completePasswordReset({
        token: "valid-length-token-123456",
        password: "weak",
        confirmPassword: "weak",
      })
    ).rejects.toBeInstanceOf(ValidationError);

    mockResetFindUnique.mockResolvedValueOnce({
      id: "prt_exp",
      userId: "u1",
      expiresAt: new Date(Date.now() - 10_000),
      consumedAt: null,
      user: { id: "u1", name: "Ada", email: "ada@example.com", status: "ACTIVE", deletedAt: null },
    });
    await expect(
      completePasswordReset({
        token: "valid-length-token-123456",
        password: "NewStrongPassword!2026",
        confirmPassword: "NewStrongPassword!2026",
      })
    ).rejects.toBeInstanceOf(ValidationError);

    mockResetFindUnique.mockResolvedValueOnce({
      id: "prt_used",
      userId: "u1",
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: new Date(),
      user: { id: "u1", name: "Ada", email: "ada@example.com", status: "ACTIVE", deletedAt: null },
    });
    await expect(
      completePasswordReset({
        token: "valid-length-token-123456",
        password: "NewStrongPassword!2026",
        confirmPassword: "NewStrongPassword!2026",
      })
    ).rejects.toBeInstanceOf(ValidationError);

    mockResetFindUnique.mockResolvedValue({
      id: "prt_race",
      userId: "u1",
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      user: { id: "u1", name: "Ada", email: "ada@example.com", status: "ACTIVE", deletedAt: null },
    });
    mockResetUpdateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });

    const results = await Promise.allSettled([
      completePasswordReset({
        token: "concurrent-reset-token-123456",
        password: "NewStrongPassword!2026",
        confirmPassword: "NewStrongPassword!2026",
      }),
      completePasswordReset({
        token: "concurrent-reset-token-123456",
        password: "NewStrongPassword!2026",
        confirmPassword: "NewStrongPassword!2026",
      }),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
  });
});
