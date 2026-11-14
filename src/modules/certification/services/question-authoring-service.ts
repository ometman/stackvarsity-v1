import "server-only";
import type { CertificationLifecycleStatus } from "@/generated/prisma/enums";
import { recordAuditEvent } from "@/modules/auth/audit";
import {
  requireTrackEditor,
  requireTrackReviewer,
} from "@/modules/certification/permissions/track-permissions";
import {
  createPracticeQuestionSchema,
  transitionQuestionStatusSchema,
} from "@/modules/certification/schemas/practice-schemas";
import { CertificationServiceError } from "@/modules/certification/services/track-errors";
import { getDb } from "@/server/db";

const QUESTION_TRANSITIONS: Record<
  CertificationLifecycleStatus,
  readonly CertificationLifecycleStatus[]
> = {
  DRAFT: ["IN_REVIEW"],
  IN_REVIEW: ["DRAFT", "PUBLISHED"],
  PUBLISHED: ["RETIRED"],
  RETIRED: ["DRAFT"],
};

export async function createPracticeQuestion(trackId: string, rawInput: unknown) {
  const session = await requireTrackEditor(trackId);
  const parsed = createPracticeQuestionSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new CertificationServiceError(
      parsed.error.issues[0]?.message ?? "Invalid practice question input",
      400,
      "VALIDATION_ERROR"
    );
  }

  const input = parsed.data;
  const db = getDb();

  const [track, objective] = await Promise.all([
    db.preparationTrack.findUnique({ where: { id: trackId }, select: { examVersionId: true } }),
    db.examObjective.findUnique({
      where: { id: input.objectiveId },
      select: { id: true, examVersionId: true },
    }),
  ]);

  if (!track) {
    throw new CertificationServiceError("Preparation track not found", 404, "NOT_FOUND");
  }
  if (!objective || objective.examVersionId !== track.examVersionId) {
    throw new CertificationServiceError(
      "Objective does not belong to this track's exam version",
      400,
      "OBJECTIVE_MISMATCH"
    );
  }

  const question = await db.practiceQuestion.create({
    data: {
      trackId,
      objectiveId: input.objectiveId,
      stem: input.stem,
      explanation: input.explanation,
      sourceReference: input.sourceReference ?? null,
      originType: input.originType,
      licenseNote: input.licenseNote,
      status: "DRAFT",
      version: 1,
      createdById: session.user.id,
      options: {
        create: input.options.map((opt, idx) => ({
          label: opt.label,
          isCorrect: opt.isCorrect,
          position: idx + 1,
        })),
      },
    },
    include: { options: { orderBy: { position: "asc" } } },
  });

  await recordAuditEvent({
    actorId: session.user.id,
    eventType: "CERTIFICATION_QUESTION_CREATED",
    metadata: { trackId, questionId: question.id, originType: question.originType },
  });

  return question;
}

export async function transitionPracticeQuestionStatus(
  trackId: string,
  questionId: string,
  rawInput: unknown
) {
  const parsed = transitionQuestionStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new CertificationServiceError(
      parsed.error.issues[0]?.message ?? "Invalid question status transition",
      400,
      "VALIDATION_ERROR"
    );
  }

  const { targetStatus } = parsed.data;
  const session =
    targetStatus === "IN_REVIEW"
      ? await requireTrackEditor(trackId)
      : await requireTrackReviewer(trackId);

  const db = getDb();
  const question = await db.practiceQuestion.findUnique({
    where: { id: questionId },
    include: { options: true },
  });

  if (!question || question.trackId !== trackId) {
    throw new CertificationServiceError("Practice question not found", 404, "NOT_FOUND");
  }

  if (!QUESTION_TRANSITIONS[question.status].includes(targetStatus)) {
    throw new CertificationServiceError(
      `Invalid status transition from ${question.status} to ${targetStatus}`,
      400,
      "INVALID_TRANSITION"
    );
  }

  if (
    targetStatus === "PUBLISHED" &&
    session.user.role !== "ADMIN" &&
    question.createdById === session.user.id
  ) {
    throw new CertificationServiceError(
      "Question authors cannot self-approve their own practice items",
      403,
      "SEPARATION_OF_DUTIES"
    );
  }

  if (targetStatus === "PUBLISHED") {
    const correctCount = question.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1 || !question.explanation.trim() || !question.licenseNote.trim()) {
      throw new CertificationServiceError(
        "Published items require 1 correct option, an explanation, and provenance/license metadata",
        400,
        "INCOMPLETE_QUESTION"
      );
    }
  }

  const now = new Date();
  const updated = await db.practiceQuestion.update({
    where: { id: questionId },
    data: {
      status: targetStatus,
      reviewedById:
        targetStatus === "PUBLISHED" || targetStatus === "RETIRED"
          ? session.user.id
          : question.reviewedById,
      publishedAt: targetStatus === "PUBLISHED" ? (question.publishedAt ?? now) : question.publishedAt,
      retiredAt: targetStatus === "RETIRED" ? now : targetStatus === "DRAFT" ? null : question.retiredAt,
    },
  });

  await recordAuditEvent({
    actorId: session.user.id,
    eventType: "CERTIFICATION_QUESTION_STATUS_CHANGED",
    metadata: { trackId, questionId, from: question.status, to: targetStatus },
  });

  return updated;
}

export async function listStaffTrackQuestions(trackId: string) {
  await requireTrackEditor(trackId);
  const db = getDb();

  return db.practiceQuestion.findMany({
    where: { trackId },
    include: {
      objective: { select: { id: true, objectiveKey: true, title: true } },
      options: { orderBy: { position: "asc" } },
    },
    orderBy: [{ updatedAt: "desc" }],
  });
}
