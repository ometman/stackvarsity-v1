import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "@/modules/auth/errors";

const mockRequireAuth = vi.fn();
const mockDb = {
  lesson: { findUnique: vi.fn() },
  enrollment: { findUnique: vi.fn() },
  $transaction: vi.fn(),
};

vi.mock("@/modules/auth/server-auth", () => ({
  requireAuth: () => mockRequireAuth(),
}));

vi.mock("@/server/db", () => ({
  getDb: () => mockDb,
}));

import { POST as progressRoute } from "@/app/api/learning/progress/route";
import { calculateProgressPercent } from "@/modules/learning/services/progress-service";

describe("Server-authoritative progress tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates progress percentages safely including 0-lesson and 100% cases", () => {
    expect(calculateProgressPercent(0, 0)).toBe(0);
    expect(calculateProgressPercent(1, 2)).toBe(50);
    expect(calculateProgressPercent(3, 3)).toBe(100);
    expect(calculateProgressPercent(5, 3)).toBe(100);
  });

  it("returns 401 when unauthenticated on POST /api/learning/progress", async () => {
    mockRequireAuth.mockRejectedValueOnce(new UnauthorizedError());
    const res = await progressRoute(
      new Request("http://localhost/api/learning/progress", {
        method: "POST",
        body: JSON.stringify({ lessonId: "l1", completed: true }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("denies progress updates when learner has no active enrollment (IDOR check)", async () => {
    mockRequireAuth.mockResolvedValueOnce({ user: { id: "u-other" } });
    mockDb.lesson.findUnique.mockResolvedValueOnce({
      id: "l1",
      archivedAt: null,
      isPublished: true,
      module: {
        archivedAt: null,
        course: { id: "c1", status: "PUBLISHED", archivedAt: null },
      },
    });
    mockDb.enrollment.findUnique.mockResolvedValueOnce(null);

    const res = await progressRoute(
      new Request("http://localhost/api/learning/progress", {
        method: "POST",
        body: JSON.stringify({ lessonId: "l1", completed: true }),
      })
    );
    expect(res.status).toBe(403);
  });

  it("marks lesson complete, reaches 100%, and marks enrollment COMPLETED", async () => {
    mockRequireAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    mockDb.lesson.findUnique.mockResolvedValueOnce({
      id: "l2",
      archivedAt: null,
      isPublished: true,
      module: {
        archivedAt: null,
        course: { id: "c1", status: "PUBLISHED", archivedAt: null },
      },
    });
    mockDb.enrollment.findUnique.mockResolvedValueOnce({ id: "e1", status: "ACTIVE" });

    const enrollmentUpdate = vi.fn().mockResolvedValue({});
    mockDb.$transaction.mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
      cb({
        lessonProgress: {
          upsert: vi.fn().mockResolvedValue({}),
          count: vi.fn().mockResolvedValue(2),
        },
        lesson: {
          findMany: vi.fn().mockResolvedValue([{ id: "l1" }, { id: "l2" }]),
        },
        courseProgress: {
          upsert: vi.fn().mockResolvedValue({}),
        },
        enrollment: {
          update: enrollmentUpdate,
        },
      })
    );

    const res = await progressRoute(
      new Request("http://localhost/api/learning/progress", {
        method: "POST",
        body: JSON.stringify({ lessonId: "l2", completed: true }),
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.progressPercent).toBe(100);
    expect(json.courseCompleted).toBe(true);
    expect(enrollmentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "COMPLETED" }),
      })
    );
  });

  it("reverts enrollment to ACTIVE when a learner unmarks a completed lesson", async () => {
    mockRequireAuth.mockResolvedValueOnce({ user: { id: "u1" } });
    mockDb.lesson.findUnique.mockResolvedValueOnce({
      id: "l2",
      archivedAt: null,
      isPublished: true,
      module: {
        archivedAt: null,
        course: { id: "c1", status: "PUBLISHED", archivedAt: null },
      },
    });
    mockDb.enrollment.findUnique.mockResolvedValueOnce({ id: "e1", status: "COMPLETED" });

    const enrollmentUpdate = vi.fn().mockResolvedValue({});
    mockDb.$transaction.mockImplementationOnce(async (cb: (tx: unknown) => unknown) =>
      cb({
        lessonProgress: {
          upsert: vi.fn().mockResolvedValue({}),
          count: vi.fn().mockResolvedValue(1),
        },
        lesson: {
          findMany: vi.fn().mockResolvedValue([{ id: "l1" }, { id: "l2" }]),
        },
        courseProgress: {
          upsert: vi.fn().mockResolvedValue({}),
        },
        enrollment: {
          update: enrollmentUpdate,
        },
      })
    );

    const res = await progressRoute(
      new Request("http://localhost/api/learning/progress", {
        method: "POST",
        body: JSON.stringify({ lessonId: "l2", completed: false }),
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.progressPercent).toBe(50);
    expect(json.courseCompleted).toBe(false);
    expect(enrollmentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "ACTIVE", completedAt: null }),
      })
    );
  });
});
