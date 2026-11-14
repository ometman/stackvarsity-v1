import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/modules/auth/errors";
import {
  createDomainSchema,
  createProviderSchema,
} from "@/modules/certification/schemas/certification-schemas";

const mockRequireRole = vi.fn();
const mockRecordAuditEvent = vi.fn();

const mockDb = {
  trackAssignment: {
    findFirst: vi.fn(),
  },
  preparationTrack: {
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
  examVersion: {
    update: vi.fn(),
  },
  $transaction: vi.fn(),
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

describe("Phase 5 certification schemas, RBAC, and lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.$transaction.mockImplementation(async (cb: (tx: typeof mockDb) => Promise<unknown>) =>
      cb(mockDb)
    );
  });

  it("rejects unsafe URLs and invalid weight ranges in Zod schemas", () => {
    const badProvider = createProviderSchema.safeParse({
      slug: "bad-provider",
      name: "Bad Provider",
      officialHomepageUrl: "javascript:alert(1)",
    });
    expect(badProvider.success).toBe(false);

    const badDomain = createDomainSchema.safeParse({
      examVersionId: "ver-1",
      domainKey: "D1",
      title: "Domain 1",
      weightMinPercent: 60,
      weightMaxPercent: 30,
      position: 1,
    });
    expect(badDomain.success).toBe(false);
  });

  it("blocks unassigned instructors from editing a track", async () => {
    mockRequireRole.mockResolvedValue({
      user: { id: "inst-other", role: "INSTRUCTOR", mfaEnabled: false },
      mfaVerifiedAt: null,
    });
    mockDb.trackAssignment.findFirst.mockResolvedValue(null);

    const { updatePreparationTrack } = await import(
      "@/modules/certification/services/track-authoring-service"
    );

    await expect(
      updatePreparationTrack("track-1", { expectedRevision: 1, title: "Tampered" })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("prevents an author from self-approving their own track for publication", async () => {
    mockRequireRole.mockResolvedValue({
      user: { id: "inst-1", role: "INSTRUCTOR", mfaEnabled: false },
      mfaVerifiedAt: null,
    });
    mockDb.trackAssignment.findFirst.mockResolvedValue({ id: "assign-1" });
    mockDb.preparationTrack.findUnique.mockResolvedValue({
      id: "track-1",
      status: "IN_REVIEW",
      createdById: "inst-1",
      disclaimer: "Independent training provider.",
      examVersion: {
        status: "DRAFT",
        domains: [{ id: "dom-1" }],
        objectives: [{ id: "obj-1" }],
      },
    });

    const { transitionPreparationTrackStatus } = await import(
      "@/modules/certification/services/track-lifecycle-service"
    );

    await expect(
      transitionPreparationTrackStatus("track-1", {
        expectedRevision: 1,
        targetStatus: "PUBLISHED",
      })
    ).rejects.toMatchObject({ code: "SEPARATION_OF_DUTIES", statusCode: 403 });
  });

  it("surfaces optimistic concurrency conflicts when revision is stale", async () => {
    mockRequireRole.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN", mfaEnabled: true },
      mfaVerifiedAt: new Date(),
    });
    mockDb.preparationTrack.findUnique.mockResolvedValue({
      id: "track-1",
      status: "DRAFT",
      revision: 2,
    });
    mockDb.preparationTrack.updateMany.mockResolvedValue({ count: 0 });

    const { updatePreparationTrack } = await import(
      "@/modules/certification/services/track-authoring-service"
    );

    await expect(
      updatePreparationTrack("track-1", { expectedRevision: 1, title: "Updated Title" })
    ).rejects.toMatchObject({ code: "CONCURRENCY_CONFLICT", statusCode: 409 });
  });

  it("allows admin to publish a complete track in IN_REVIEW", async () => {
    mockRequireRole.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN", mfaEnabled: true },
      mfaVerifiedAt: new Date(),
    });
    mockDb.preparationTrack.findUnique
      .mockResolvedValueOnce({
        id: "track-1",
        examVersionId: "ver-1",
        status: "IN_REVIEW",
        createdById: "inst-1",
        disclaimer: "Independent training provider.",
        publishedAt: null,
        retiredAt: null,
        lastReviewedAt: null,
        examVersion: {
          status: "DRAFT",
          domains: [{ id: "dom-1" }],
          objectives: [{ id: "obj-1" }],
        },
      })
      .mockResolvedValueOnce({
        id: "track-1",
        status: "PUBLISHED",
        revision: 2,
      });
    mockDb.preparationTrack.updateMany.mockResolvedValue({ count: 1 });
    mockDb.examVersion.update.mockResolvedValue({ id: "ver-1", status: "PUBLISHED" });

    const { transitionPreparationTrackStatus } = await import(
      "@/modules/certification/services/track-lifecycle-service"
    );

    const result = await transitionPreparationTrackStatus("track-1", {
      expectedRevision: 1,
      targetStatus: "PUBLISHED",
    });

    expect(result?.status).toBe("PUBLISHED");
    expect(mockRecordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "CERTIFICATION_TRACK_STATUS_CHANGED" })
    );
  });
});
