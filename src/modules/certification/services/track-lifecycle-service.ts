import "server-only";
import type { CertificationLifecycleStatus } from "@/generated/prisma/enums";
import { recordAuditEvent } from "@/modules/auth/audit";
import {
  requireTrackEditor,
  requireTrackReviewer,
} from "@/modules/certification/permissions/track-permissions";
import { transitionTrackStatusSchema } from "@/modules/certification/schemas/certification-schemas";
import { CertificationServiceError } from "@/modules/certification/services/track-errors";
import { getDb } from "@/server/db";

const ALLOWED_TRANSITIONS: Record<
  CertificationLifecycleStatus,
  readonly CertificationLifecycleStatus[]
> = {
  DRAFT: ["IN_REVIEW"],
  IN_REVIEW: ["DRAFT", "PUBLISHED"],
  PUBLISHED: ["RETIRED"],
  RETIRED: ["DRAFT"],
};

export async function transitionPreparationTrackStatus(trackId: string, rawInput: unknown) {
  const parsed = transitionTrackStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new CertificationServiceError(
      parsed.error.issues[0]?.message ?? "Invalid status transition payload",
      400,
      "VALIDATION_ERROR"
    );
  }

  const { expectedRevision, targetStatus, reason } = parsed.data;

  const session =
    targetStatus === "IN_REVIEW"
      ? await requireTrackEditor(trackId)
      : await requireTrackReviewer(trackId);

  const db = getDb();
  const track = await db.preparationTrack.findUnique({
    where: { id: trackId },
    include: {
      examVersion: {
        include: {
          domains: { select: { id: true } },
          objectives: { select: { id: true } },
        },
      },
    },
  });

  if (!track) {
    throw new CertificationServiceError("Preparation track not found", 404, "NOT_FOUND");
  }

  const allowed = ALLOWED_TRANSITIONS[track.status];
  if (!allowed.includes(targetStatus)) {
    throw new CertificationServiceError(
      `Invalid status transition from ${track.status} to ${targetStatus}`,
      400,
      "INVALID_TRANSITION"
    );
  }

  if (
    targetStatus === "PUBLISHED" &&
    session.user.role !== "ADMIN" &&
    track.createdById === session.user.id
  ) {
    await recordAuditEvent({
      actorId: session.user.id,
      eventType: "CERTIFICATION_SELF_APPROVAL_DENIED",
      outcome: "DENIED",
      metadata: { trackId },
    });
    throw new CertificationServiceError(
      "Track authors cannot self-approve their own track for publication",
      403,
      "SEPARATION_OF_DUTIES"
    );
  }

  if (targetStatus === "PUBLISHED") {
    if (track.examVersion.status === "RETIRED") {
      throw new CertificationServiceError(
        "Cannot publish a track bound to a retired exam version",
        400,
        "RETIRED_EXAM_VERSION"
      );
    }
    if (track.examVersion.domains.length === 0 || track.examVersion.objectives.length === 0) {
      throw new CertificationServiceError(
        "Track exam version must have at least one domain and one objective before publishing",
        400,
        "INCOMPLETE_BLUEPRINT"
      );
    }
    if (!track.disclaimer.trim()) {
      throw new CertificationServiceError(
        "Independent provider disclaimer is required before publishing",
        400,
        "MISSING_DISCLAIMER"
      );
    }
  }

  const now = new Date();
  const updateResult = await db.$transaction(async (tx) => {
    const res = await tx.preparationTrack.updateMany({
      where: {
        id: trackId,
        revision: expectedRevision,
      },
      data: {
        status: targetStatus,
        revision: { increment: 1 },
        lastReviewedAt: targetStatus === "PUBLISHED" ? now : track.lastReviewedAt,
        publishedAt: targetStatus === "PUBLISHED" ? (track.publishedAt ?? now) : track.publishedAt,
        retiredAt: targetStatus === "RETIRED" ? now : targetStatus === "DRAFT" ? null : track.retiredAt,
      },
    });

    if (res.count === 0) {
      throw new CertificationServiceError(
        "Track was modified by another user. Reload and try again.",
        409,
        "CONCURRENCY_CONFLICT"
      );
    }

    if (targetStatus === "PUBLISHED" && track.examVersion.status !== "PUBLISHED") {
      await tx.examVersion.update({
        where: { id: track.examVersionId },
        data: { status: "PUBLISHED" },
      });
    }

    return tx.preparationTrack.findUnique({ where: { id: trackId } });
  });

  await recordAuditEvent({
    actorId: session.user.id,
    eventType: "CERTIFICATION_TRACK_STATUS_CHANGED",
    metadata: {
      trackId,
      fromStatus: track.status,
      toStatus: targetStatus,
      reason: reason ?? null,
    },
  });

  return updateResult;
}
