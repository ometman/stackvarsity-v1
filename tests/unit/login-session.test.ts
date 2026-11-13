import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { MockAuthError, mockAuth, mockSignIn, mockSignOut } = vi.hoisted(() => ({
  MockAuthError: class MockAuthError extends Error {
    constructor(message = "AuthError") {
      super(message);
      this.name = "AuthError";
    }
  },
  mockAuth: vi.fn(),
  mockSignIn: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("next-auth", () => ({
  AuthError: MockAuthError,
}));

const mockSessionFindUnique = vi.fn();
const mockSessionDeleteMany = vi.fn();
const mockUserFindUnique = vi.fn();
const mockAuditCreate = vi.fn();

vi.mock("@/server/db", () => ({
  getDb: () => ({
    session: {
      findUnique: mockSessionFindUnique,
      deleteMany: mockSessionDeleteMany,
    },
    user: {
      findUnique: mockUserFindUnique,
    },
    securityAuditEvent: {
      create: mockAuditCreate,
    },
  }),
}));

vi.mock("@/modules/auth/auth", () => ({
  auth: mockAuth,
  signIn: mockSignIn,
  signOut: mockSignOut,
}));

import { POST as loginPost } from "@/app/api/auth/login/route";
import { POST as logoutPost } from "@/app/api/auth/logout/route";
import { getDefaultDashboardPath, sanitizeRedirectPath } from "@/modules/auth/redirects";
import { findValidDatabaseSession } from "@/modules/auth/session-repository";
import { getRateLimiter } from "@/server/rate-limit";

describe("Login, logout, and session management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRateLimiter().clearAll();
  });

  it("prevents open-redirect attacks in sanitizeRedirectPath", () => {
    expect(sanitizeRedirectPath("/student/courses")).toBe("/student/courses");
    expect(sanitizeRedirectPath("https://evil.com")).toBe("/student");
    expect(sanitizeRedirectPath("//evil.com")).toBe("/student");
    expect(sanitizeRedirectPath("/\\evil.com")).toBe("/student");
    expect(sanitizeRedirectPath("/javascript:alert(1)")).toBe("/student");
    expect(getDefaultDashboardPath("ADMIN")).toBe("/admin");
    expect(getDefaultDashboardPath("INSTRUCTOR")).toBe("/instructor");
    expect(getDefaultDashboardPath("STUDENT")).toBe("/student");
  });

  it("rejects expired sessions and suspended/disabled user sessions", async () => {
    mockSessionFindUnique.mockResolvedValueOnce({
      id: "s_exp",
      sessionToken: "tok_exp",
      expires: new Date(Date.now() - 10_000),
      mfaVerifiedAt: null,
      user: {
        id: "u1",
        name: "Student",
        email: "s@example.com",
        role: "STUDENT",
        status: "ACTIVE",
        emailVerified: new Date(),
        mfaEnabled: false,
        deletedAt: null,
      },
    });
    mockSessionDeleteMany.mockResolvedValueOnce({ count: 1 });
    await expect(findValidDatabaseSession("tok_exp")).resolves.toBeNull();
    expect(mockSessionDeleteMany).toHaveBeenCalledTimes(1);

    mockSessionFindUnique.mockResolvedValueOnce({
      id: "s_susp",
      sessionToken: "tok_susp",
      expires: new Date(Date.now() + 60_000),
      mfaVerifiedAt: null,
      user: {
        id: "u2",
        name: "Suspended",
        email: "susp@example.com",
        role: "STUDENT",
        status: "SUSPENDED",
        emailVerified: new Date(),
        mfaEnabled: false,
        deletedAt: null,
      },
    });
    await expect(findValidDatabaseSession("tok_susp")).resolves.toBeNull();
  });

  it("handles successful login, generic credential errors, and rate limiting", async () => {
    mockSignIn.mockResolvedValueOnce(undefined);
    mockUserFindUnique.mockResolvedValueOnce({ role: "STUDENT", mfaEnabled: false });

    const okReq = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "10.10.10.1" },
      body: JSON.stringify({
        email: "student@example.com",
        password: "Password!2026",
        next: "//evil.com",
      }),
    });
    const okRes = await loginPost(okReq);
    expect(okRes.status).toBe(200);
    const okJson = await okRes.json();
    expect(okJson.redirectTo).toBe("/student");

    mockSignIn.mockRejectedValueOnce(new MockAuthError("CredentialsSignin"));
    const badReq = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "10.10.10.2" },
      body: JSON.stringify({
        email: "unknown@example.com",
        password: "WrongPassword!2026",
      }),
    });
    const badRes = await loginPost(badReq);
    expect(badRes.status).toBe(401);
    const badJson = await badRes.json();
    expect(badJson.error).toBe("Invalid email or password.");

    for (let i = 0; i < 10; i += 1) {
      mockSignIn.mockRejectedValueOnce(new MockAuthError("CredentialsSignin"));
      await loginPost(
        new NextRequest("http://localhost:3000/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json", "x-forwarded-for": "10.10.10.9" },
          body: JSON.stringify({
            email: "brute@example.com",
            password: "WrongPassword!2026",
          }),
        })
      );
    }

    const blockedRes = await loginPost(
      new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "10.10.10.9" },
        body: JSON.stringify({
          email: "brute@example.com",
          password: "WrongPassword!2026",
        }),
      })
    );
    expect(blockedRes.status).toBe(429);
  });

  it("revokes the database session on logout", async () => {
    mockAuth.mockResolvedValueOnce({ sessionToken: "active_tok" });
    mockSessionFindUnique.mockResolvedValueOnce({
      id: "s1",
      sessionToken: "active_tok",
      expires: new Date(Date.now() + 60_000),
      mfaVerifiedAt: null,
      user: {
        id: "u1",
        name: "Student",
        email: "s@example.com",
        role: "STUDENT",
        status: "ACTIVE",
        emailVerified: new Date(),
        mfaEnabled: false,
        deletedAt: null,
      },
    });

    const res = await logoutPost();
    expect(res.status).toBe(200);
    expect(mockSessionDeleteMany).toHaveBeenCalledWith({
      where: { sessionToken: "active_tok" },
    });
    expect(mockSignOut).toHaveBeenCalledWith({ redirect: false });
  });
});
