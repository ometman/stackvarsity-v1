import "server-only";
import { recordAuditEvent } from "@/modules/auth/audit";
import { requireRole } from "@/modules/auth/rbac";
import {
  requireTrackEditor,
  requireTrackReviewer,
} from "@/modules/certification/permissions/track-permissions";
import {
  assignTrackStaffSchema,
  createCertificationSchema,
  createDomainSchema,
  createExamVersionSchema,
  createObjectiveSchema,
  createProviderSchema,
  createTrackSchema,
  updateTrackSchema,
} from "@/modules/certification/schemas/certification-schemas";
import { CertificationServiceError } from "@/modules/certification/services/track-errors";
import { getDb } from "@/server/db";

function parseOrThrow<T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: { issues: Array<{ message: string }> } } }, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success || result.data === undefined) {
    throw new CertificationServiceError(
      result.error?.issues[0]?.message ?? "Invalid certification input",
      400,
      "VALIDATION_ERROR"
    );
  }
  return result.data;
}

export async function createProvider(rawInput: unknown) {
  const session = await requireRole(["ADMIN"]);
  const input = parseOrThrow(createProviderSchema, rawInput);
  const db = getDb();

  const existing = await db.certificationProvider.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });
  if (existing) {
    throw new CertificationServiceError("Provider slug already exists", 409, "DUPLICATE_SLUG");
  }

  const provider = await db.certificationProvider.create({
    data: {
      slug: input.slug,
      name: input.name,
      officialHomepageUrl: input.officialHomepageUrl ?? null,
      trademarkNotice: input.trademarkNotice ?? null,
    },
  });

  await recordAuditEvent({
    actorId: session.user.id,
    eventType: "CERTIFICATION_PROVIDER_CREATED",
    metadata: { providerId: provider.id, slug: provider.slug },
  });

  return provider;
}

export async function createCertification(rawInput: unknown) {
  const session = await requireRole(["ADMIN"]);
  const input = parseOrThrow(createCertificationSchema, rawInput);
  const db = getDb();

  const provider = await db.certificationProvider.findUnique({
    where: { id: input.providerId },
    select: { id: true },
  });
  if (!provider) {
    throw new CertificationServiceError("Certification provider not found", 404, "NOT_FOUND");
  }

  const existing = await db.certification.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });
  if (existing) {
    throw new CertificationServiceError("Certification slug already exists", 409, "DUPLICATE_SLUG");
  }

  const certification = await db.certification.create({
    data: input,
  });

  await recordAuditEvent({
    actorId: session.user.id,
    eventType: "CERTIFICATION_CREATED",
    metadata: { certificationId: certification.id, slug: certification.slug },
  });

  return certification;
}

export async function createExamVersion(rawInput: unknown) {
  const session = await requireRole(["ADMIN"]);
  const input = parseOrThrow(createExamVersionSchema, rawInput);
  const db = getDb();

  const cert = await db.certification.findUnique({
    where: { id: input.certificationId },
    select: { id: true },
  });
  if (!cert) {
    throw new CertificationServiceError("Certification not found", 404, "NOT_FOUND");
  }

  const existing = await db.examVersion.findUnique({
    where: {
      certificationId_examCode_versionLabel: {
        certificationId: input.certificationId,
        examCode: input.examCode,
        versionLabel: input.versionLabel,
      },
    },
    select: { id: true },
  });
  if (existing) {
    throw new CertificationServiceError(
      "Exam version with this code and label already exists",
      409,
      "DUPLICATE_EXAM_VERSION"
    );
  }

  const version = await db.examVersion.create({
    data: {
      certificationId: input.certificationId,
      examCode: input.examCode,
      versionLabel: input.versionLabel,
      effectiveFrom: input.effectiveFrom ?? null,
      sourceUrl: input.sourceUrl ?? null,
      verificationStatus: input.verificationStatus,
      verifiedAt: input.verificationStatus === "VERIFIED" ? new Date() : null,
      sourceNotes: input.sourceNotes ?? null,
    },
  });

  await recordAuditEvent({
    actorId: session.user.id,
    eventType: "CERTIFICATION_EXAM_VERSION_CREATED",
    metadata: { examVersionId: version.id, examCode: version.examCode },
  });

  return version;
}

export async function createExamDomain(trackId: string, rawInput: unknown) {
  await requireTrackEditor(trackId);
  const input = parseOrThrow(createDomainSchema, rawInput);
  const db = getDb();

  const track = await db.preparationTrack.findUnique({
    where: { id: trackId },
    select: { examVersionId: true },
  });
  if (!track || track.examVersionId !== input.examVersionId) {
    throw new CertificationServiceError(
      "Domain does not belong to this track's exam version",
      400,
      "EXAM_VERSION_MISMATCH"
    );
  }

  return db.examDomain.create({
    data: {
      examVersionId: input.examVersionId,
      domainKey: input.domainKey,
      title: input.title,
      description: input.description ?? null,
      weightMinPercent: input.weightMinPercent ?? null,
      weightMaxPercent: input.weightMaxPercent ?? null,
      position: input.position,
    },
  });
}

async function assertNoObjectiveCycle(
  examVersionId: string,
  parentId: string | null | undefined,
  candidateId?: string
): Promise<void> {
  if (!parentId) return;
  if (candidateId && parentId === candidateId) {
    throw new CertificationServiceError(
      "Objective cannot be its own parent",
      400,
      "OBJECTIVE_CYCLE"
    );
  }

  const db = getDb();
  const visited = new Set<string>();
  let currentId: string | null = parentId;

  while (currentId) {
    if (visited.has(currentId) || (candidateId && currentId === candidateId)) {
      throw new CertificationServiceError(
        "Circular objective hierarchy detected",
        400,
        "OBJECTIVE_CYCLE"
      );
    }
    visited.add(currentId);
    const parent: { id: string; examVersionId: string; parentId: string | null } | null =
      await db.examObjective.findUnique({
        where: { id: currentId },
        select: { id: true, examVersionId: true, parentId: true },
      });
    if (!parent || parent.examVersionId !== examVersionId) {
      throw new CertificationServiceError(
        "Parent objective not found in this exam version",
        400,
        "INVALID_PARENT_OBJECTIVE"
      );
    }
    currentId = parent.parentId;
  }
}

export async function createExamObjective(trackId: string, rawInput: unknown) {
  await requireTrackEditor(trackId);
  const input = parseOrThrow(createObjectiveSchema, rawInput);
  const db = getDb();

  const [track, domain] = await Promise.all([
    db.preparationTrack.findUnique({
      where: { id: trackId },
      select: { examVersionId: true },
    }),
    db.examDomain.findUnique({
      where: { id: input.domainId },
      select: { id: true, examVersionId: true },
    }),
  ]);

  if (!track || track.examVersionId !== input.examVersionId) {
    throw new CertificationServiceError("Track exam version mismatch", 400, "EXAM_VERSION_MISMATCH");
  }
  if (!domain || domain.examVersionId !== input.examVersionId) {
    throw new CertificationServiceError("Domain not found in this exam version", 404, "NOT_FOUND");
  }

  await assertNoObjectiveCycle(input.examVersionId, input.parentId);

  return db.examObjective.create({
    data: {
      examVersionId: input.examVersionId,
      domainId: input.domainId,
      parentId: input.parentId ?? null,
      objectiveKey: input.objectiveKey,
      title: input.title,
      summary: input.summary ?? null,
      sourceReference: input.sourceReference ?? null,
      position: input.position,
    },
  });
}

export async function createPreparationTrack(rawInput: unknown) {
  const session = await requireRole(["INSTRUCTOR", "ADMIN"]);
  const input = parseOrThrow(createTrackSchema, rawInput);
  const db = getDb();

  const [examVersion, existingSlug] = await Promise.all([
    db.examVersion.findUnique({
      where: { id: input.examVersionId },
      select: { id: true },
    }),
    db.preparationTrack.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    }),
  ]);

  if (!examVersion) {
    throw new CertificationServiceError("Exam version not found", 404, "NOT_FOUND");
  }
  if (existingSlug) {
    throw new CertificationServiceError("Track slug already exists", 409, "DUPLICATE_SLUG");
  }

  const track = await db.$transaction(async (tx) => {
    const created = await tx.preparationTrack.create({
      data: {
        examVersionId: input.examVersionId,
        slug: input.slug,
        title: input.title,
        summary: input.summary,
        overview: input.overview,
        accessType: input.accessType,
        status: "DRAFT",
        intendedAudience: input.intendedAudience,
        prerequisites: input.prerequisites,
        disclaimer: input.disclaimer,
        createdById: session.user.id,
      },
    });

    await tx.trackAssignment.create({
      data: {
        trackId: created.id,
        userId: session.user.id,
        role: "AUTHOR",
        assignedById: session.user.id,
      },
    });

    return created;
  });

  await recordAuditEvent({
    actorId: session.user.id,
    eventType: "CERTIFICATION_TRACK_CREATED",
    metadata: { trackId: track.id, slug: track.slug },
  });

  return track;
}

export async function updatePreparationTrack(trackId: string, rawInput: unknown) {
  const session = await requireTrackEditor(trackId);
  const input = parseOrThrow(updateTrackSchema, rawInput);
  const db = getDb();

  const existing = await db.preparationTrack.findUnique({
    where: { id: trackId },
    select: { id: true, status: true, revision: true },
  });
  if (!existing) {
    throw new CertificationServiceError("Preparation track not found", 404, "NOT_FOUND");
  }
  if (existing.status === "RETIRED") {
    throw new CertificationServiceError(
      "Retired preparation tracks cannot be edited directly",
      400,
      "TRACK_RETIRED"
    );
  }

  const updated = await db.preparationTrack.updateMany({
    where: { id: trackId, revision: input.expectedRevision },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.summary !== undefined ? { summary: input.summary } : {}),
      ...(input.overview !== undefined ? { overview: input.overview } : {}),
      ...(input.accessType !== undefined ? { accessType: input.accessType } : {}),
      ...(input.intendedAudience !== undefined ? { intendedAudience: input.intendedAudience } : {}),
      ...(input.prerequisites !== undefined ? { prerequisites: input.prerequisites } : {}),
      ...(input.disclaimer !== undefined ? { disclaimer: input.disclaimer } : {}),
      revision: { increment: 1 },
    },
  });

  if (updated.count === 0) {
    throw new CertificationServiceError(
      "Track was modified by another user. Reload and try again.",
      409,
      "CONCURRENCY_CONFLICT"
    );
  }

  await recordAuditEvent({
    actorId: session.user.id,
    eventType: "CERTIFICATION_TRACK_UPDATED",
    metadata: { trackId, previousRevision: input.expectedRevision },
  });

  return db.preparationTrack.findUnique({ where: { id: trackId } });
}

export async function assignTrackStaff(trackId: string, rawInput: unknown) {
  const session = await requireRole(["ADMIN"]);
  const input = parseOrThrow(assignTrackStaffSchema, rawInput);
  const db = getDb();

  const [track, user] = await Promise.all([
    db.preparationTrack.findUnique({ where: { id: trackId }, select: { id: true } }),
    db.user.findUnique({ where: { id: input.userId }, select: { id: true, status: true, role: true } }),
  ]);

  if (!track) {
    throw new CertificationServiceError("Preparation track not found", 404, "NOT_FOUND");
  }
  if (!user || user.status !== "ACTIVE" || (user.role !== "INSTRUCTOR" && user.role !== "ADMIN")) {
    throw new CertificationServiceError(
      "Target user must be an active instructor or administrator",
      400,
      "INVALID_STAFF_USER"
    );
  }

  const assignment = await db.trackAssignment.upsert({
    where: {
      trackId_userId_role: {
        trackId,
        userId: input.userId,
        role: input.role,
      },
    },
    update: {},
    create: {
      trackId,
      userId: input.userId,
      role: input.role,
      assignedById: session.user.id,
    },
  });

  await recordAuditEvent({
    actorId: session.user.id,
    targetUserId: input.userId,
    eventType: "CERTIFICATION_STAFF_ASSIGNED",
    metadata: { trackId, role: input.role },
  });

  return assignment;
}

export async function listStaffTracks() {
  const session = await requireRole(["INSTRUCTOR", "ADMIN"]);
  const db = getDb();

  return db.preparationTrack.findMany({
    where:
      session.user.role === "ADMIN"
        ? { archivedAt: null }
        : {
            archivedAt: null,
            assignments: { some: { userId: session.user.id } },
          },
    include: {
      examVersion: {
        include: {
          certification: {
            include: { provider: true },
          },
        },
      },
      _count: {
        select: { enrollments: true, resourceMappings: true },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function getStaffTrackDetail(trackId: string) {
  const session = await requireRole(["INSTRUCTOR", "ADMIN"]);
  const db = getDb();

  const track = await db.preparationTrack.findUnique({
    where: { id: trackId },
    include: {
      assignments: true,
      examVersion: {
        include: {
          certification: { include: { provider: true } },
          domains: {
            orderBy: { position: "asc" },
            include: {
              objectives: { orderBy: { position: "asc" } },
            },
          },
        },
      },
      resourceMappings: {
        orderBy: { position: "asc" },
        include: {
          course: { select: { id: true, slug: true, title: true, status: true, archivedAt: true } },
          lesson: {
            select: {
              id: true,
              slug: true,
              title: true,
              isPublished: true,
              archivedAt: true,
              module: { select: { courseId: true, course: { select: { slug: true, status: true } } } },
            },
          },
        },
      },
    },
  });

  if (!track) {
    throw new CertificationServiceError("Preparation track not found", 404, "NOT_FOUND");
  }

  if (
    session.user.role !== "ADMIN" &&
    !track.assignments.some((a) => a.userId === session.user.id)
  ) {
    await requireTrackReviewer(trackId).catch(() => {
      throw new CertificationServiceError("Forbidden", 403, "FORBIDDEN");
    });
  }

  return track;
}
