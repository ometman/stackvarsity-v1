import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireRole = vi.fn();
const mockRecordAuditEvent = vi.fn();

const mockDb = {
  trackAssignment: { findFirst: vi.fn() },
  preparationTrack: { findUnique: vi.fn() },
  examObjective: { findUnique: vi.fn() },
  course: { findUnique: vi.fn() },
  lesson: { findUnique: vi.fn() },
  objectiveResourceMapping: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  enrollment: { findMany: vi.fn() },
};

vi.mock("@/modules/auth/rbac", () => ({
  requireRole: (...args: unknown[]) => mockRequireRole(...args),
}));

vi.mock("@/modules/auth/audit", () => ({
  recordAuditEvent: (...args: unknown[]) => mockRecordAuditEvent(...args),
}));

vi.mock("@/server/db", () => ({
  getDb: () => mockDb,
}));

describe("Phase 5 objective-to-LMS resource mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      user: { id: "inst-1", role: "INSTRUCTOR", mfaEnabled: false },
      mfaVerifiedAt: null,
    });
    mockDb.trackAssignment.findFirst.mockResolvedValue({ id: "assign-1" });
    mockDb.preparationTrack.findUnique.mockResolvedValue({
      id: "track-1",
      examVersionId: "ver-1",
    });
    mockDb.examObjective.findUnique.mockResolvedValue({
      id: "obj-1",
      examVersionId: "ver-1",
    });
  });

  it("rejects mapping when neither courseId nor lessonId is provided", async () => {
    const { addObjectiveResourceMapping } = await import(
      "@/modules/certification/services/objective-mapping-service"
    );

    await expect(
      addObjectiveResourceMapping("track-1", { objectiveId: "obj-1" })
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR", statusCode: 400 });
  });

  it("blocks mapping another instructor's unpublished course", async () => {
    mockDb.course.findUnique.mockResolvedValue({
      id: "course-secret",
      status: "DRAFT",
      archivedAt: null,
      assignments: [{ userId: "inst-other" }],
    });

    const { addObjectiveResourceMapping } = await import(
      "@/modules/certification/services/objective-mapping-service"
    );

    await expect(
      addObjectiveResourceMapping("track-1", {
        objectiveId: "obj-1",
        courseId: "course-secret",
      })
    ).rejects.toMatchObject({ code: "UNPUBLISHED_CONTENT_FORBIDDEN", statusCode: 403 });
  });

  it("rejects duplicate objective resource mappings", async () => {
    mockDb.course.findUnique.mockResolvedValue({
      id: "course-1",
      status: "PUBLISHED",
      archivedAt: null,
      assignments: [],
    });
    mockDb.objectiveResourceMapping.findFirst.mockResolvedValue({ id: "map-existing" });

    const { addObjectiveResourceMapping } = await import(
      "@/modules/certification/services/objective-mapping-service"
    );

    await expect(
      addObjectiveResourceMapping("track-1", {
        objectiveId: "obj-1",
        courseId: "course-1",
      })
    ).rejects.toMatchObject({ code: "DUPLICATE_MAPPING", statusCode: 409 });
  });

  it("flags stale mappings when a mapped course is archived or unpublished", async () => {
    mockDb.objectiveResourceMapping.findMany.mockResolvedValue([
      {
        id: "map-1",
        courseId: "course-1",
        lessonId: null,
        isStale: false,
        staleReason: null,
        course: { id: "course-1", status: "ARCHIVED", archivedAt: new Date() },
        lesson: null,
      },
    ]);

    const { revalidateTrackMappings } = await import(
      "@/modules/certification/services/objective-mapping-service"
    );

    const result = await revalidateTrackMappings("track-1");
    expect(result).toEqual({ totalMappings: 1, staleCount: 1 });
    expect(mockDb.objectiveResourceMapping.update).toHaveBeenCalledWith({
      where: { id: "map-1" },
      data: {
        isStale: true,
        staleReason: "Mapped course is missing or archived",
      },
    });
  });

  it("preserves Phase 4 PAID lock and enrollment status in learner-safe mappings", async () => {
    mockDb.objectiveResourceMapping.findMany.mockResolvedValue([
      {
        id: "map-paid",
        isRequired: true,
        notes: "Paid deep dive",
        objective: { id: "obj-1", objectiveKey: "1.1", title: "Cloud Basics", domainId: "dom-1" },
        course: {
          id: "course-paid",
          slug: "paid-cloud",
          title: "Paid Cloud",
          status: "PUBLISHED",
          accessType: "PAID",
          archivedAt: null,
        },
        lesson: null,
      },
    ]);
    mockDb.enrollment.findMany.mockResolvedValue([]);

    const { listLearnerSafeObjectiveMappings } = await import(
      "@/modules/certification/services/objective-mapping-service"
    );

    const mappings = await listLearnerSafeObjectiveMappings("track-1", "student-1");
    expect(mappings).toHaveLength(1);
    expect(mappings[0]).toMatchObject({
      courseId: "course-paid",
      isEnrolled: false,
      isLockedPaid: true,
    });
  });
});
