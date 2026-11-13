import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";

const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockAuditCreate = vi.fn();

vi.mock("@/server/db", () => ({
  getDb: () => ({
    user: {
      findUnique: mockFindUnique,
      create: mockCreate,
    },
    securityAuditEvent: {
      create: mockAuditCreate,
    },
  }),
}));

vi.mock("@/modules/auth/verification-service", () => ({
  issueVerificationTokenAndSendEmail: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/auth/register/route";
import { ConflictError, ValidationError } from "@/modules/auth/errors";
import { registerStudent } from "@/modules/auth/registration-service";
import { getRateLimiter } from "@/server/rate-limit";

describe("Student registration service and API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRateLimiter().clearAll();
  });

  it("registers a student with normalized email, Argon2id password hash, and STUDENT role", async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    mockCreate.mockImplementationOnce(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "user_123",
      name: data.name,
      email: data.email,
      role: data.role,
      createdAt: new Date("2026-11-13T00:00:00Z"),
    }));

    const result = await registerStudent({
      name: "  Ada Lovelace ",
      email: "  ADA@MyStackVarsity.COM ",
      password: "StrongPassword!2026",
      confirmPassword: "StrongPassword!2026",
    });

    expect(result.email).toBe("ada@mystackvarsity.com");
    expect(result.role).toBe("STUDENT");
    expect(mockCreate).toHaveBeenCalledTimes(1);

    const createCall = mockCreate.mock.calls[0][0].data;
    expect(createCall.role).toBe("STUDENT");
    expect(createCall.status).toBe("ACTIVE");
    expect(createCall.emailVerified).toBeNull();
    expect(createCall.passwordHash).toMatch(/^\$argon2id\$/);
    expect(createCall.passwordHash).not.toContain("StrongPassword!2026");
  });

  it("rejects weak passwords, mismatched confirmations, and invalid inputs", async () => {
    await expect(
      registerStudent({
        name: "A",
        email: "bad-email",
        password: "weak",
        confirmPassword: "weak",
      })
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      registerStudent({
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "StrongPassword!2026",
        confirmPassword: "DifferentPassword!2026",
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects duplicate emails and handles concurrent P2002 unique constraint races", async () => {
    mockFindUnique.mockResolvedValueOnce({ id: "existing_user" });
    await expect(
      registerStudent({
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "StrongPassword!2026",
        confirmPassword: "StrongPassword!2026",
      })
    ).rejects.toBeInstanceOf(ConflictError);

    mockFindUnique.mockResolvedValueOnce(null);
    mockCreate.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "7.10.1",
      })
    );
    await expect(
      registerStudent({
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "StrongPassword!2026",
        confirmPassword: "StrongPassword!2026",
      })
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects role injection and internal security field overrides", async () => {
    await expect(
      registerStudent({
        name: "Attacker",
        email: "attacker@example.com",
        password: "StrongPassword!2026",
        confirmPassword: "StrongPassword!2026",
        role: "ADMIN",
      })
    ).rejects.toBeInstanceOf(ValidationError);

    await expect(
      registerStudent({
        name: "Attacker",
        email: "attacker@example.com",
        password: "StrongPassword!2026",
        confirmPassword: "StrongPassword!2026",
        emailVerified: "2026-01-01T00:00:00Z",
      })
    ).rejects.toBeInstanceOf(ValidationError);

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("propagates unexpected database failures safely in the API route", async () => {
    mockFindUnique.mockRejectedValueOnce(new Error("Connection refused"));

    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "10.0.0.1" },
      body: JSON.stringify({
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "StrongPassword!2026",
        confirmPassword: "StrongPassword!2026",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).not.toContain("Connection refused");
  });

  it("enforces rate limiting on POST /api/auth/register", async () => {
    for (let i = 0; i < 5; i += 1) {
      mockFindUnique.mockResolvedValueOnce({ id: "existing" });
      const req = new NextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "192.0.2.50" },
        body: JSON.stringify({
          name: "Ada Lovelace",
          email: "ada@example.com",
          password: "StrongPassword!2026",
          confirmPassword: "StrongPassword!2026",
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(409);
    }

    const blockedReq = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "192.0.2.50" },
      body: JSON.stringify({
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "StrongPassword!2026",
        confirmPassword: "StrongPassword!2026",
      }),
    });
    const blockedRes = await POST(blockedReq);
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get("Retry-After")).toBeTruthy();
  });
});
