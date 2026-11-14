import "server-only";
import { requireRole } from "@/modules/auth/rbac";
import { submitPracticeResponseSchema } from "@/modules/certification/schemas/practice-schemas";
import { CertificationServiceError } from "@/modules/certification/services/track-errors";
import { getDb } from "@/server/db";
import { InMemoryRateLimiter } from "@/server/rate-limit";

const practiceRateLimiter = new InMemoryRateLimiter();
const MAX_SESSION_QUESTIONS = 10;

export interface SafePracticeQuestionDto {
  id: string;
  stem: string;
  objectiveKey: string;
  objectiveTitle: string;
  options: Array<{ id: string; label: string }>;
}

export async function startOrResumePracticeSession(trackId: string) {
  const session = await requireRole(["STUDENT", "ADMIN"]);
  const db = getDb();

  const enrollment = await db.learnerPreparationEnrollment.findUnique({
    where: {
      userId_trackId: {
        userId: session.user.id,
        trackId,
      },
    },
    select: { id: true },
  });

  if (!enrollment) {
    throw new CertificationServiceError(
      "Join this preparation track before starting formative practice",
      403,
      "TRACK_NOT_JOINED"
    );
  }

  let attempt = await db.practiceAttempt.findFirst({
    where: {
      userId: session.user.id,
      trackId,
      completedAt: null,
    },
    include: {
      responses: {
        select: {
          questionId: true,
          selectedOptionId: true,
          isCorrect: true,
        },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  if (!attempt) {
    attempt = await db.practiceAttempt.create({
      data: {
        userId: session.user.id,
        trackId,
      },
      include: {
        responses: {
          select: {
            questionId: true,
            selectedOptionId: true,
            isCorrect: true,
          },
        },
      },
    });
  }

  // Never select isCorrect or explanation when serving unanswered items to the browser.
  const questions = await db.practiceQuestion.findMany({
    where: {
      trackId,
      status: "PUBLISHED",
    },
    take: MAX_SESSION_QUESTIONS,
    orderBy: [{ createdAt: "asc" }],
    select: {
      id: true,
      stem: true,
      objective: {
        select: { objectiveKey: true, title: true },
      },
      options: {
        orderBy: { position: "asc" },
        select: { id: true, label: true },
      },
    },
  });

  const safeQuestions: SafePracticeQuestionDto[] = questions.map((q) => ({
    id: q.id,
    stem: q.stem,
    objectiveKey: q.objective.objectiveKey,
    objectiveTitle: q.objective.title,
    options: q.options,
  }));

  return {
    attemptId: attempt.id,
    questions: safeQuestions,
    responses: attempt.responses,
  };
}

export async function submitPracticeResponse(trackId: string, rawInput: unknown) {
  const session = await requireRole(["STUDENT", "ADMIN"]);

  const limitCheck = await practiceRateLimiter.consume(
    `practice:${session.user.id}:${trackId}`,
    30,
    60_000
  );
  if (!limitCheck.allowed) {
    throw new CertificationServiceError(
      "Too many practice submissions. Please wait a moment and try again.",
      429,
      "RATE_LIMITED"
    );
  }

  const parsed = submitPracticeResponseSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new CertificationServiceError(
      parsed.error.issues[0]?.message ?? "Invalid practice response",
      400,
      "VALIDATION_ERROR"
    );
  }

  const { attemptId, questionId, selectedOptionId, idempotencyKey } = parsed.data;
  const db = getDb();

  const attempt = await db.practiceAttempt.findUnique({
    where: { id: attemptId },
    select: { id: true, userId: true, trackId: true },
  });

  if (!attempt || attempt.trackId !== trackId) {
    throw new CertificationServiceError("Practice session not found", 404, "NOT_FOUND");
  }
  if (attempt.userId !== session.user.id) {
    throw new CertificationServiceError("Forbidden", 403, "FORBIDDEN");
  }

  const existingByKey = await db.practiceResponse.findUnique({
    where: {
      userId_idempotencyKey: {
        userId: session.user.id,
        idempotencyKey,
      },
    },
  });

  const question = await db.practiceQuestion.findUnique({
    where: { id: questionId },
    include: {
      options: { orderBy: { position: "asc" } },
    },
  });

  if (!question || question.trackId !== trackId || question.status !== "PUBLISHED") {
    throw new CertificationServiceError(
      "Practice question is not available",
      404,
      "QUESTION_UNAVAILABLE"
    );
  }

  const correctOption = question.options.find((o) => o.isCorrect);

  if (existingByKey) {
    return {
      responseId: existingByKey.id,
      isCorrect: existingByKey.isCorrect,
      correctOptionId: correctOption?.id ?? null,
      explanation: question.explanation,
      sourceReference: question.sourceReference,
      idempotentReplay: true,
    };
  }

  const existingForAttempt = await db.practiceResponse.findUnique({
    where: {
      attemptId_questionId: {
        attemptId,
        questionId,
      },
    },
  });

  if (existingForAttempt) {
    return {
      responseId: existingForAttempt.id,
      isCorrect: existingForAttempt.isCorrect,
      correctOptionId: correctOption?.id ?? null,
      explanation: question.explanation,
      sourceReference: question.sourceReference,
      idempotentReplay: true,
    };
  }

  const chosenOption = question.options.find((o) => o.id === selectedOptionId);
  if (!chosenOption) {
    throw new CertificationServiceError(
      "Selected option does not belong to this question",
      400,
      "INVALID_OPTION"
    );
  }

  const isCorrect = chosenOption.isCorrect;

  const created = await db.practiceResponse.create({
    data: {
      attemptId,
      userId: session.user.id,
      questionId,
      questionVersion: question.version,
      selectedOptionId,
      isCorrect,
      idempotencyKey,
    },
  });

  return {
    responseId: created.id,
    isCorrect,
    correctOptionId: correctOption?.id ?? null,
    explanation: question.explanation,
    sourceReference: question.sourceReference,
    idempotentReplay: false,
  };
}

export async function getLearnerPracticeReview(trackId: string) {
  const session = await requireRole(["STUDENT", "ADMIN"]);
  const db = getDb();

  return db.practiceResponse.findMany({
    where: {
      userId: session.user.id,
      question: { trackId },
    },
    orderBy: { answeredAt: "desc" },
    take: 50,
    include: {
      question: {
        select: {
          id: true,
          stem: true,
          explanation: true,
          status: true,
          sourceReference: true,
          objective: {
            select: { id: true, objectiveKey: true, title: true },
          },
          options: {
            orderBy: { position: "asc" },
            select: { id: true, label: true, isCorrect: true },
          },
        },
      },
    },
  });
}
