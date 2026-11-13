import { describe, expect, it, vi } from "vitest";

vi.mock("@/modules/auth/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/modules/auth/session-repository", () => ({
  findValidDatabaseSession: vi.fn(),
}));

import { auth } from "@/modules/auth/auth";
import { UnauthorizedError } from "@/modules/auth/errors";
import { hashPassword, verifyDummyPassword, verifyPassword } from "@/modules/auth/password";
import { credentialsLoginSchema, normalizeEmail } from "@/modules/auth/schemas";
import { getCurrentSession, requireAuth } from "@/modules/auth/server-auth";
import { findValidDatabaseSession } from "@/modules/auth/session-repository";
import { generateOpaqueToken, hashToken } from "@/modules/auth/tokens";

describe("Authentication infrastructure", () => {
  it("hashes and verifies passwords with Argon2id", async () => {
    const password = "CorrectHorseBatteryStaple!2026";
    const hashed = await hashPassword(password);

    expect(hashed).toMatch(/^\$argon2id\$/);
    expect(hashed).not.toContain(password);
    expect(await verifyPassword(hashed, password)).toBe(true);
    expect(await verifyPassword(hashed, "wrong-password")).toBe(false);
    await expect(verifyDummyPassword("anything")).resolves.toBeUndefined();
  });

  it("generates opaque tokens and deterministic SHA-256 hashes", () => {
    const tokenA = generateOpaqueToken();
    const tokenB = generateOpaqueToken();

    expect(tokenA).not.toBe(tokenB);
    expect(tokenA.length).toBeGreaterThanOrEqual(32);
    expect(hashToken(tokenA)).toBe(hashToken(tokenA));
    expect(hashToken(tokenA)).not.toBe(tokenA);
    expect(hashToken(tokenA)).toMatch(/^[a-f0-9]{64}$/);
  });

  it("normalizes emails and validates login input", () => {
    expect(normalizeEmail("  Student@MyStackVarsity.COM  ")).toBe("student@mystackvarsity.com");
    const parsed = credentialsLoginSchema.safeParse({
      email: "  Student@MyStackVarsity.COM ",
      password: "Password123!",
      rememberMe: true,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe("student@mystackvarsity.com");
      expect(parsed.data.rememberMe).toBe(true);
    }
  });

  it("enforces server-side session validation in requireAuth", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never);
    await expect(getCurrentSession()).resolves.toBeNull();

    vi.mocked(auth).mockResolvedValueOnce(null as never);
    await expect(requireAuth()).rejects.toBeInstanceOf(UnauthorizedError);

    vi.mocked(auth).mockResolvedValueOnce({
      sessionToken: "valid-token",
      expires: new Date(Date.now() + 60_000).toISOString(),
      user: { id: "u1", role: "STUDENT", status: "ACTIVE", mfaEnabled: false },
    } as never);
    vi.mocked(findValidDatabaseSession).mockResolvedValueOnce({
      id: "s1",
      sessionToken: "valid-token",
      expires: new Date(Date.now() + 60_000),
      mfaVerifiedAt: null,
      user: {
        id: "u1",
        name: "Test Student",
        email: "student@example.com",
        role: "STUDENT",
        status: "ACTIVE",
        emailVerified: new Date(),
        mfaEnabled: false,
      },
    });

    const session = await requireAuth();
    expect(session.user.id).toBe("u1");
    expect(session.user.role).toBe("STUDENT");
  });
});
