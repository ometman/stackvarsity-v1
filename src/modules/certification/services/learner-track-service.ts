import "server-only";
import { recordAuditEvent } from "@/modules/auth/audit";
import { requireRole } from "@/modules/auth/rbac";
import { listLearnerSafeObjectiveMappings } from "@/modules/certification/services/objective-mapping-service";
import { CertificationServiceError } from "@/modules/certification/services/track-errors";
import { getDb } from "@/server/db";

export async function joinPreparationTrack(trackId: string) {
  const session = await requireRole(["STUDENT", "ADMIN"]);
  const db = getDb();

  const track = await db.preparationTrack.findUnique({
    where: { id: trackId },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      accessType: true,
      archivedAt: true,
    },
  });

  if (!track || track.archivedAt !== null || track.status !== "PUBLISHED") {
    throw new CertificationServiceError(
      "This preparation track is not available to join",
      404,
      "TRACK_UNAVAILABLE"
    );
  }

  const existing = await db.learnerPreparationEnrollment.findUnique({
    where: {
      userId_trackId: {
        userId: session.user.id,
        trackId,
      },
    },
  });

  if (existing) {
    return existing;
  }

  if (track.accessType === "PAID") {
    throw new CertificationServiceError(
      "Paid preparation tracks require checkout, which will be available in Phase 7.",
      403,
      "PAID_TRACK_LOCKED"
    );
  }

  const enrollment = await db.learnerPreparationEnrollment.create({
    data: {
      userId: session.user.id,
      trackId,
      status: "ACTIVE",
    },
  });

  await recordAuditEvent({
    actorId: session.user.id,
    eventType: "CERTIFICATION_TRACK_JOINED",
    metadata: { trackId, slug: track.slug },
  });

  return enrollment;
}

export async function listLearnerTracks() {
  const session = await requireRole(["STUDENT", "ADMIN"]);
  const db = getDb();

  const [enrollments, publishedTracks] = await Promise.all([
    db.learnerPreparationEnrollment.findMany({
      where: { userId: session.user.id },
      include: {
        track: {
          include: {
            examVersion: {
              include: {
                certification: { include: { provider: true } },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.preparationTrack.findMany({
      where: {
        status: "PUBLISHED",
        archivedAt: null,
        examVersion: {
          status: "PUBLISHED",
          certification: { isActive: true, provider: { isActive: true } },
        },
      },
      include: {
        examVersion: {
          include: {
            certification: { include: { provider: true } },
          },
        },
      },
      orderBy: { title: "asc" },
    }),
  ]);

  const enrolledIds = new Set(enrollments.map((e) => e.trackId));
  const availableTracks = publishedTracks.filter((t) => !enrolledIds.has(t.id));

  return {
    enrollments,
    availableTracks,
  };
}

export async function getLearnerTrackWorkspace(trackId: string) {
  const session = await requireRole(["STUDENT", "ADMIN"]);
  const db = getDb();

  const [track, enrollment] = await Promise.all([
    db.preparationTrack.findUnique({
      where: { id: trackId },
      include: {
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
      },
    }),
    db.learnerPreparationEnrollment.findUnique({
      where: {
        userId_trackId: {
          userId: session.user.id,
          trackId,
        },
      },
    }),
  ]);

  if (!track || track.archivedAt !== null) {
    throw new CertificationServiceError("Preparation track not found", 404, "NOT_FOUND");
  }

  if (track.status === "DRAFT" || track.status === "IN_REVIEW") {
    throw new CertificationServiceError("Preparation track not found", 404, "NOT_FOUND");
  }

  if (track.status === "RETIRED" && !enrollment) {
    throw new CertificationServiceError("Preparation track not found", 404, "NOT_FOUND");
  }

  const mappings = await listLearnerSafeObjectiveMappings(trackId, session.user.id);

  return {
    track,
    enrollment,
    mappings,
  };
}
