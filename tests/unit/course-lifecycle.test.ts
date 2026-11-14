import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/modules/auth/errors";

const mockRequirePermission = vi.fn();
const mockRecordAuditEvent = vi.fn();
const mockDb = {
  course: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
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

import { POST as publishRoute } from "@/app/api/instructor/courses/[courseId]/publish/route";

describe("Course review and publish workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects publishing an incomplete course with no modules or lessons", async () => {
    mockRequirePermission.mockResolvedValueOnce({
      user: { id: "inst-1", role: "INSTRUCTOR", status: "ACTIVE", mfaEnabled: false },
      mfaVerifiedAt: null,
    });
    mockDb.course.findUnique
      .mockResolvedValueOnce({ id: "c1", assignments: [{ id: "a1" }] })
      .mockResolvedValueOnce({
        id: "c1",
        slug: "incomplete-course",
        title: "Incomplete",
        summary: "Valid summary text here",
        overview: "Valid overview text here",
        category: "Cloud & Linux",
        level: "Beginner",
        status: "DRAFT",
        publishedAt: null,
        modules: [],
      });

    const response = await publishRoute(
      new Request("http://localhost/api/instructor/courses/c1/publish", {
        method: "POST",
        body: JSON.stringify({ targetStatus: "PUBLISHED" }),
      }),
      { params: Promise.resolve({ courseId: "c1" }) }
    );

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe("COURSE_INCOMPLETE");
  });

  it("rejects invalid state transitions (e.g., ARCHIVED -> PUBLISHED)", async () => {
    mockRequirePermission.mockResolvedValueOnce({
      user: { id: "inst-1", role: "INSTRUCTOR", status: "ACTIVE", mfaEnabled: false },
      mfaVerifiedAt: null,
    });
    mockDb.course.findUnique
      .mockResolvedValueOnce({ id: "c1", assignments: [{ id: "a1" }] })
      .mockResolvedValueOnce({
        id: "c1",
        slug: "archived-course",
        title: "Archived",
        summary: "Valid summary text here",
        overview: "Valid overview text here",
        category: "Cloud & Linux",
        level: "Beginner",
        status: "ARCHIVED",
        publishedAt: null,
        modules: [
          {
            archivedAt: null,
            lessons: [{ archivedAt: null, isPublished: true, content: "Lesson content" }],
          },
        ],
      });

    const response = await publishRoute(
      new Request("http://localhost/api/instructor/courses/c1/publish", {
        method: "POST",
        body: JSON.stringify({ targetStatus: "PUBLISHED" }),
      }),
      { params: Promise.resolve({ courseId: "c1" }) }
    );

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe("INVALID_TRANSITION");
  });

  it("publishes a complete course and records an audit event", async () => {
    mockRequirePermission.mockResolvedValueOnce({
      user: { id: "inst-1", role: "INSTRUCTOR", status: "ACTIVE", mfaEnabled: false },
      mfaVerifiedAt: null,
    });
    mockDb.course.findUnique
      .mockResolvedValueOnce({ id: "c1", assignments: [{ id: "a1" }] })
      .mockResolvedValueOnce({
        id: "c1",
        slug: "complete-course",
        title: "Complete Course",
        summary: "Valid summary text here",
        overview: "Valid overview text here",
        category: "Cloud & Linux",
        level: "Beginner",
        status: "DRAFT",
        publishedAt: null,
        modules: [
          {
            archivedAt: null,
            lessons: [{ archivedAt: null, isPublished: true, content: "Lesson body" }],
          },
        ],
      });
    mockDb.course.update.mockResolvedValueOnce({
      id: "c1",
      slug: "complete-course",
      status: "PUBLISHED",
    });

    const response = await publishRoute(
      new Request("http://localhost/api/instructor/courses/c1/publish", {
        method: "POST",
        body: JSON.stringify({ targetStatus: "PUBLISHED" }),
      }),
      { params: Promise.resolve({ courseId: "c1" }) }
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.course.status).toBe("PUBLISHED");
    expect(mockRecordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "COURSE_STATUS_CHANGED",
        metadata: expect.objectContaining({ fromStatus: "DRAFT", toStatus: "PUBLISHED" }),
      })
    );
  });

  it("denies unauthorized users from publishing", async () => {
    mockRequirePermission.mockRejectedValueOnce(new ForbiddenError());
    const response = await publishRoute(
      new Request("http://localhost/api/instructor/courses/c1/publish", {
        method: "POST",
        body: JSON.stringify({ targetStatus: "PUBLISHED" }),
      }),
      { params: Promise.resolve({ courseId: "c1" }) }
    );
    expect(response.status).toBe(403);
  });
});
