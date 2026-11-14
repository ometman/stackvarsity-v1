import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "@/modules/auth/errors";

const mockRequireAuth = vi.fn();
const mockRequireRole = vi.fn();
const mockRecordAuditEvent = vi.fn();
const mockDb = {
  course: { findUnique: vi.fn(), findFirst: vi.fn() },
  enrollment: { findUnique: vi.fn(), findMany: vi.fn(), upsert: vi.fn(), update: vi.fn() },
  courseProgress: { findMany: vi.fn() },
  $transaction: vi.fn(),
};

vi.mock("@/modules/auth/server-auth", () => ({
  requireAuth: () => mockRequireAuth(),
}));

vi.mock("@/modules/auth/rbac", () => ({
  requireRole: (...args: unknown[]) => mockRequireRole(...args),
}));

vi.mock("@/modules/auth/audit", () => ({
  recordAuditEvent: (...args: unknown[]) => mockRecordAuditEvent(...args),
}));

vi.mock("@/server/db", () => ({
  getDb: () => mockDb,
}));

import { POST as enrollRoute } from "@/app/api/enrollments/route";
import { requireCourseEntitlement } from "@/modules/enrollments/services/enrollment-service";

describe("Free enrollment & entitlement engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated on POST /api/enrollments", async () => {
    mockRequireAuth.mockRejectedValueOnce(new UnauthorizedError());
    const res = await enrollRoute(
      new Request("http://localhost/api/enrollments", {
        method: "POST",
        body: JSON.stringify({ courseId: "c1" }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("rejects enrollment in unpublished courses", async () => {
    mockRequireAuth.mockResolvedValueOnce({ user: { id: "u1", role: "STUDENT" } });
    mockDb.course.findUnique.mockResolvedValueOnce({
      id: "c1",
      slug: "draft-course",
      status: "DRAFT",
      accessType: "FREE",
      archivedAt: null,
      modules: [],
    });

    const res = await enrollRoute(
      new Request("http://localhost/api/enrollments", {
        method: "POST",
        body: JSON.stringify({ courseId: "c1" }),
      })
    );
    expect(res.status).toBe(404);
  });

  it("rejects self-enrollment in PAID courses until Phase 7", async () => {
    mockRequireAuth.mockResolvedValueOnce({ user: { id: "u1", role: "STUDENT" } });
    mockDb.course.findUnique.mockResolvedValueOnce({
      id: "c2",
      slug: "paid-course",
      status: "PUBLISHED",
      accessType: "PAID",
      archivedAt: null,
      modules: [],
    });

    const res = await enrollRoute(
      new Request("http://localhost/api/enrollments", {
        method: "POST",
        body: JSON.stringify({ courseId: "c2" }),
      })
    );
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe("PAID_COURSE_LOCKED");
  });

  it("is idempotent when learner re-enrolls in a published free course", async () => {
    mockRequireAuth.mockResolvedValueOnce({ user: { id: "u1", role: "STUDENT" } });
    mockDb.course.findUnique.mockResolvedValueOnce({
      id: "c1",
      slug: "free-course",
      status: "PUBLISHED",
      accessType: "FREE",
      archivedAt: null,
      modules: [{ lessons: [{ id: "l1" }] }],
    });
    mockDb.enrollment.findUnique.mockResolvedValueOnce({
      id: "e1",
      userId: "u1",
      courseId: "c1",
      status: "ACTIVE",
      source: "FREE",
    });

    const res = await enrollRoute(
      new Request("http://localhost/api/enrollments", {
        method: "POST",
        body: JSON.stringify({ courseId: "c1" }),
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.created).toBe(false);
    expect(json.enrollment.id).toBe("e1");
  });

  it("blocks un-enrolled student in requireCourseEntitlement", async () => {
    mockDb.course.findFirst.mockResolvedValueOnce({
      id: "c1",
      slug: "free-course",
      status: "PUBLISHED",
      archivedAt: null,
      assignments: [],
      enrollments: [],
    });

    await expect(requireCourseEntitlement("u1", "STUDENT", "free-course", "slug")).rejects.toThrow(
      /active enrollment/i
    );
  });
});
