import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireRole = vi.fn();

const mockDb = {
  trackAssignment: { findFirst: vi.fn() },
  preparationTrack: { findUnique: vi.fn() },
  objectiveResourceMapping: { findMany: vi.fn() },
  lessonProgress: { findMany: vi.fn() },
  studyTask: { findMany: vi.fn() },
  practiceResponse: { findMany: vi.fn() },
};

vi.mock("@/modules/auth/rbac", () => ({
  requireRole: (...args: unknown[]) => mockRequireRole(...args),
}));

vi.mock("@/server/db", () => ({
  getDb: () => mockDb,
}));

describe("Phase 5 coverage insights and governance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      user: { id: "student-1", role: "STUDENT", mfaEnabled: false },
      mfaVerifiedAt: null,
    });
  });

  it("handles zero denominators safely and separates lesson coverage from practice accuracy", async () => {
    mockDb.preparationTrack.findUnique.mockResolvedValue({
      id: "track-1",
      title: "AWS Prep",
      status: "PUBLISHED",
      archivedAt: null,
      examVersion: {
        domains: [
          {
            id: "dom-1",
            domainKey: "D1",
            title: "Cloud Concepts",
            objectives: [{ id: "obj-1", objectiveKey: "1.1", title: "Benefits" }],
          },
        ],
      },
    });
    mockDb.objectiveResourceMapping.findMany.mockResolvedValue([]);
    mockDb.lessonProgress.findMany.mockResolvedValue([]);
    mockDb.studyTask.findMany.mockResolvedValue([]);
    mockDb.practiceResponse.findMany.mockResolvedValue([
      { isCorrect: true, question: { objectiveId: "obj-1" } },
      { isCorrect: false, question: { objectiveId: "obj-1" } },
    ]);

    const { getLearnerTrackCoverage } = await import(
      "@/modules/certification/services/coverage-service"
    );

    const coverage = await getLearnerTrackCoverage("track-1");
    expect(coverage.domainSummaries[0]).toMatchObject({
      mappedLessonCount: 0,
      lessonCoveragePercent: null,
      practiceAnsweredCount: 2,
      practiceCorrectCount: 1,
      practiceAccuracyPercent: 50,
    });
    expect(coverage.recommendations).toHaveLength(1);
    expect(coverage.recommendations[0].reason).toContain("50%");
  });

  it("computes staff governance summary without exposing individual student records", async () => {
    mockRequireRole.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN", mfaEnabled: true },
      mfaVerifiedAt: new Date(),
    });
    mockDb.preparationTrack.findUnique.mockResolvedValue({
      id: "track-1",
      title: "AWS Prep",
      status: "PUBLISHED",
      revision: 3,
      lastReviewedAt: new Date("2026-11-14T00:00:00Z"),
      examVersion: {
        verificationStatus: "VERIFIED",
        status: "PUBLISHED",
        certification: { provider: { name: "AWS" } },
        objectives: [{ id: "obj-1" }, { id: "obj-2" }],
      },
      resourceMappings: [{ id: "m-1", objectiveId: "obj-1", isStale: true }],
      practiceQuestions: [
        { id: "q-1", status: "PUBLISHED" },
        { id: "q-2", status: "IN_REVIEW" },
      ],
    });

    const { getTrackGovernanceSummary } = await import(
      "@/modules/certification/services/coverage-service"
    );

    const summary = await getTrackGovernanceSummary("track-1");
    expect(summary).toMatchObject({
      totalObjectives: 2,
      unmappedObjectiveCount: 1,
      staleMappingCount: 1,
      questionCounts: {
        draft: 0,
        inReview: 1,
        published: 1,
        retired: 0,
      },
    });
  });
});
