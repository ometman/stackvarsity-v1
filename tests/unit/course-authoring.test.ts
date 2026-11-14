import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLessonSchema, safeHttpUrlSchema } from "@/modules/courses/schemas/course-schemas";

const mockRequirePermission = vi.fn();
const mockRecordAuditEvent = vi.fn();
const mockDb = {
  course: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  instructorAssignment: {
    create: vi.fn(),
    upsert: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock("@/modules/auth/rbac", () => ({
  requirePermission: (...args: unknown[]) => mockRequirePermission(...args),
  requireRole: (...args: unknown[]) => mockRequirePermission(...args),
}));

vi.mock("@/modules/auth/audit", () => ({
  recordAuditEvent: (...args: unknown[]) => mockRecordAuditEvent(...args),
}));

vi.mock("@/server/db", () => ({
  getDb: () => mockDb,
}));

import {
  GET as getCoursesRoute,
  POST as postCourseRoute,
} from "@/app/api/instructor/courses/route";
import { PATCH as patchCourseRoute } from "@/app/api/instructor/courses/[courseId]/route";
import { ForbiddenError, UnauthorizedError } from "@/modules/auth/errors";

describe("Instructor course authoring APIs & schemas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unsafe URL schemes such as javascript: in lesson resources", () => {
    expect(safeHttpUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
    expect(safeHttpUrlSchema.safeParse("data:text/html,hi").success).toBe(false);
    expect(safeHttpUrlSchema.safeParse("https://www.mystackvarsity.com/guide").success).toBe(true);

    const badLesson = createLessonSchema.safeParse({
      title: "Safe Lesson",
      content: "Valid markdown content",
      resources: [{ title: "Bad", url: "javascript:void(0)" }],
    });
    expect(badLesson.success).toBe(false);
  });

  it("returns 401 when unauthenticated on GET /api/instructor/courses", async () => {
    mockRequirePermission.mockRejectedValueOnce(new UnauthorizedError());
    const response = await getCoursesRoute();
    expect(response.status).toBe(401);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("returns 403 when a STUDENT attempts to create a course", async () => {
    mockRequirePermission.mockRejectedValueOnce(new ForbiddenError());
    const response = await postCourseRoute(
      new Request("http://localhost/api/instructor/courses", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );
    expect(response.status).toBe(403);
  });

  it("denies unassigned instructor on PATCH /api/instructor/courses/[courseId] with 403", async () => {
    mockRequirePermission.mockResolvedValueOnce({
      user: { id: "inst-2", role: "INSTRUCTOR", status: "ACTIVE", mfaEnabled: false },
      mfaVerifiedAt: null,
    });
    mockDb.course.findUnique.mockResolvedValueOnce({
      id: "course-1",
      assignments: [],
    });

    const response = await patchCourseRoute(
      new Request("http://localhost/api/instructor/courses/course-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "Hijacked Title" }),
      }),
      { params: Promise.resolve({ courseId: "course-1" }) }
    );

    expect(response.status).toBe(403);
    expect(mockRecordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "inst-2",
        eventType: "COURSE_ACCESS_DENIED",
        outcome: "DENIED",
      })
    );
  });

  it("creates a draft course and auto-assigns the creator inside a transaction", async () => {
    mockRequirePermission.mockResolvedValueOnce({
      user: { id: "inst-1", role: "INSTRUCTOR", status: "ACTIVE", mfaEnabled: false },
      mfaVerifiedAt: null,
    });
    mockDb.course.findUnique.mockResolvedValueOnce(null);
    mockDb.$transaction.mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
      cb({
        course: {
          create: vi.fn().mockResolvedValue({
            id: "course-new",
            slug: "linux-basics",
            title: "Linux Basics",
            status: "DRAFT",
          }),
        },
        instructorAssignment: {
          create: vi.fn().mockResolvedValue({ id: "assign-1" }),
        },
      })
    );

    const response = await postCourseRoute(
      new Request("http://localhost/api/instructor/courses", {
        method: "POST",
        body: JSON.stringify({
          title: "Linux Basics",
          summary: "Learn foundational Linux shell and file operations.",
          overview: "A structured introduction to Linux commands, permissions, and processes.",
          category: "Cloud & Linux",
          level: "Beginner",
        }),
      })
    );

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.course.status).toBe("DRAFT");
    expect(mockRecordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "COURSE_CREATED",
        outcome: "SUCCESS",
      })
    );
  });
});
