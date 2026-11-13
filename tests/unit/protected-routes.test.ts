import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetCurrentSession, mockRedirect } = vi.hoisted(() => ({
  mockGetCurrentSession: vi.fn(),
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

const mockUserFindFirst = vi.fn();
const mockAuditFindMany = vi.fn();
const mockAuditCreate = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

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

vi.mock("@/server/db", () => ({
  getDb: () => ({
    user: {
      findFirst: mockUserFindFirst,
    },
    securityAuditEvent: {
      findMany: mockAuditFindMany,
      create: mockAuditCreate,
    },
  }),
}));

import { GET as adminAuditGet } from "@/app/api/admin/audit-events/route";
import { GET as instructorCoursesGet } from "@/app/api/instructor/courses/route";
import { GET as studentRecordGet } from "@/app/api/students/[studentId]/record/route";
import { requirePageRole } from "@/modules/auth/route-guards";

function makeSession(
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN",
  overrides: Partial<{ id: string; mfaEnabled: boolean; mfaVerifiedAt: Date | null }> = {}
) {
  return {
    id: "sess_1",
    sessionToken: "tok_1",
    expires: new Date(Date.now() + 60_000),
    mfaVerifiedAt: overrides.mfaVerifiedAt ?? null,
    user: {
      id: overrides.id ?? "user_1",
      name: "Test User",
      email: "user@example.com",
      role,
      status: "ACTIVE" as const,
      emailVerified: new Date(),
      mfaEnabled: overrides.mfaEnabled ?? false,
    },
  };
}

describe("Protected routes and resource authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enforces page-level redirects for unauthenticated, wrong-role, and pending-MFA users", async () => {
    mockGetCurrentSession.mockResolvedValueOnce(null);
    await expect(requirePageRole("STUDENT", "/student")).rejects.toThrow(
      "NEXT_REDIRECT:/login?next=%2Fstudent"
    );

    mockGetCurrentSession.mockResolvedValueOnce(makeSession("STUDENT", { id: "s1" }));
    await expect(requirePageRole("ADMIN", "/admin")).rejects.toThrow("NEXT_REDIRECT:/student");

    mockGetCurrentSession.mockResolvedValueOnce(
      makeSession("ADMIN", { id: "a1", mfaEnabled: true, mfaVerifiedAt: null })
    );
    await expect(requirePageRole("ADMIN", "/admin")).rejects.toThrow("NEXT_REDIRECT:/admin/mfa");

    mockGetCurrentSession.mockResolvedValueOnce(makeSession("INSTRUCTOR", { id: "i1" }));
    const ok = await requirePageRole(["INSTRUCTOR", "ADMIN"], "/instructor");
    expect(ok.user.id).toBe("i1");
  });

  it("prevents IDOR on GET /api/students/[studentId]/record", async () => {
    mockGetCurrentSession.mockResolvedValueOnce(null);
    const unauthRes = await studentRecordGet(new Request("http://localhost:3000"), {
      params: Promise.resolve({ studentId: "student_b" }),
    });
    expect(unauthRes.status).toBe(401);

    mockGetCurrentSession.mockResolvedValueOnce(makeSession("STUDENT", { id: "student_a" }));
    const idorRes = await studentRecordGet(new Request("http://localhost:3000"), {
      params: Promise.resolve({ studentId: "student_b" }),
    });
    expect(idorRes.status).toBe(403);

    mockGetCurrentSession.mockResolvedValueOnce(makeSession("STUDENT", { id: "student_a" }));
    mockUserFindFirst.mockResolvedValueOnce({
      id: "student_a",
      name: "Student A",
      email: "a@example.com",
      role: "STUDENT",
      status: "ACTIVE",
      emailVerified: new Date(),
      createdAt: new Date(),
    });
    const ownRes = await studentRecordGet(new Request("http://localhost:3000"), {
      params: Promise.resolve({ studentId: "student_a" }),
    });
    expect(ownRes.status).toBe(200);
    const ownJson = await ownRes.json();
    expect(ownJson.record.id).toBe("student_a");
    expect(ownJson.record.passwordHash).toBeUndefined();
  });

  it("enforces role boundaries on instructor and admin API endpoints", async () => {
    mockGetCurrentSession.mockResolvedValueOnce(makeSession("STUDENT", { id: "s1" }));
    const studentTryInstructor = await instructorCoursesGet();
    expect(studentTryInstructor.status).toBe(403);

    mockGetCurrentSession.mockResolvedValueOnce(makeSession("INSTRUCTOR", { id: "i1" }));
    const instructorOk = await instructorCoursesGet();
    expect(instructorOk.status).toBe(200);

    mockGetCurrentSession.mockResolvedValueOnce(makeSession("INSTRUCTOR", { id: "i1" }));
    const instructorTryAdmin = await adminAuditGet();
    expect(instructorTryAdmin.status).toBe(403);

    mockGetCurrentSession.mockResolvedValueOnce(
      makeSession("ADMIN", { id: "a1", mfaEnabled: true, mfaVerifiedAt: new Date() })
    );
    mockAuditFindMany.mockResolvedValueOnce([]);
    const adminOk = await adminAuditGet();
    expect(adminOk.status).toBe(200);
  });
});
