import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireRole = vi.fn();
const mockRecordAuditEvent = vi.fn();

const mockDb = {
  preparationTrack: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  learnerPreparationEnrollment: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
  objectiveResourceMapping: {
    findMany: vi.fn(),
  },
  enrollment: {
    findMany: vi.fn(),
  },
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

describe("Phase 5 learner preparation workspace and access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      user: { id: "student-1", role: "STUDENT", mfaEnabled: false },
      mfaVerifiedAt: null,
    });
    mockDb.objectiveResourceMapping.findMany.mockResolvedValue([]);
    mockDb.enrollment.findMany.mockResolvedValue([]);
  });

  it("blocks joining a PAID preparation track without checkout", async () => {
    mockDb.preparationTrack.findUnique.mockResolvedValue({
      id: "track-paid",
      slug: "paid-track",
      title: "Paid Track",
      status: "PUBLISHED",
      accessType: "PAID",
      archivedAt: null,
    });
    mockDb.learnerPreparationEnrollment.findUnique.mockResolvedValue(null);

    const { joinPreparationTrack } = await import(
      "@/modules/certification/services/learner-track-service"
    );

    await expect(joinPreparationTrack("track-paid")).rejects.toMatchObject({
      code: "PAID_TRACK_LOCKED",
      statusCode: 403,
    });
  });

  it("returns existing enrollment idempotently when already joined", async () => {
    mockDb.preparationTrack.findUnique.mockResolvedValue({
      id: "track-free",
      slug: "free-track",
      title: "Free Track",
      status: "PUBLISHED",
      accessType: "FREE",
      archivedAt: null,
    });
    mockDb.learnerPreparationEnrollment.findUnique.mockResolvedValue({
      id: "enroll-1",
      userId: "student-1",
      trackId: "track-free",
      status: "ACTIVE",
    });

    const { joinPreparationTrack } = await import(
      "@/modules/certification/services/learner-track-service"
    );

    const res = await joinPreparationTrack("track-free");
    expect(res.id).toBe("enroll-1");
    expect(mockDb.learnerPreparationEnrollment.create).not.toHaveBeenCalled();
  });

  it("hides DRAFT tracks and un-enrolled RETIRED tracks in getLearnerTrackWorkspace", async () => {
    mockDb.preparationTrack.findUnique.mockResolvedValue({
      id: "track-retired",
      status: "RETIRED",
      archivedAt: null,
      examVersion: { certification: { provider: {} }, domains: [] },
    });
    mockDb.learnerPreparationEnrollment.findUnique.mockResolvedValue(null);

    const { getLearnerTrackWorkspace } = await import(
      "@/modules/certification/services/learner-track-service"
    );

    await expect(getLearnerTrackWorkspace("track-retired")).rejects.toMatchObject({
      code: "NOT_FOUND",
      statusCode: 404,
    });
  });

  it("preserves workspace access for previously enrolled learners on RETIRED tracks", async () => {
    mockDb.preparationTrack.findUnique.mockResolvedValue({
      id: "track-retired",
      status: "RETIRED",
      archivedAt: null,
      examVersion: { certification: { provider: {} }, domains: [] },
    });
    mockDb.learnerPreparationEnrollment.findUnique.mockResolvedValue({
      id: "enroll-old",
      status: "ACTIVE",
    });

    const { getLearnerTrackWorkspace } = await import(
      "@/modules/certification/services/learner-track-service"
    );

    const workspace = await getLearnerTrackWorkspace("track-retired");
    expect(workspace.enrollment?.id).toBe("enroll-old");
  });
});
