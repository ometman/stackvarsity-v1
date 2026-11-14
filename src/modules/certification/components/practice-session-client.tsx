"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { SafePracticeQuestionDto } from "@/modules/certification/services/practice-session-service";

interface FeedbackState {
  isCorrect: boolean;
  correctOptionId: string | null;
  explanation: string;
  sourceReference: string | null;
}

interface PracticeSessionClientProps {
  trackId: string;
  attemptId: string;
  questions: SafePracticeQuestionDto[];
  initialResponses: Array<{
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
  }>;
}

export function PracticeSessionClient({
  trackId,
  attemptId,
  questions,
  initialResponses,
}: PracticeSessionClientProps) {
  const [selectedByQuestion, setSelectedByQuestion] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const r of initialResponses) {
      map[r.questionId] = r.selectedOptionId;
    }
    return map;
  });
  const [feedbackByQuestion, setFeedbackByQuestion] = useState<Record<string, FeedbackState>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (questions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        No published formative practice items are available for this track yet.
      </div>
    );
  }

  async function handleSubmit(questionId: string) {
    const selectedOptionId = selectedByQuestion[questionId];
    if (!selectedOptionId) return;

    setSubmittingId(questionId);
    setError(null);
    try {
      const response = await fetch(`/api/certifications/${trackId}/practice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          questionId,
          selectedOptionId,
          idempotencyKey: `${attemptId}:${questionId}`,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as FeedbackState & { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Unable to submit response.");
        return;
      }
      setFeedbackByQuestion((prev) => ({
        ...prev,
        [questionId]: {
          isCorrect: data.isCorrect,
          correctOptionId: data.correctOptionId,
          explanation: data.explanation,
          sourceReference: data.sourceReference,
        },
      }));
    } catch {
      setError("Network error while checking answer.");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {questions.map((question, idx) => {
        const feedback = feedbackByQuestion[question.id];
        const selectedId = selectedByQuestion[question.id] ?? "";
        const alreadySubmitted = Boolean(feedback);

        return (
          <fieldset
            key={question.id}
            className="space-y-4 rounded-lg border border-border bg-card p-6"
          >
            <legend className="sr-only">Question {idx + 1}</legend>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="outline">
                Objective {question.objectiveKey}: {question.objectiveTitle}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Item {idx + 1} of {questions.length} · Untimed knowledge check
              </span>
            </div>

            <p className="text-base font-medium text-foreground">{question.stem}</p>

            <div className="space-y-2" role="radiogroup" aria-label={`Choices for item ${idx + 1}`}>
              {question.options.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-background p-3 text-sm text-foreground hover:bg-accent/50"
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option.id}
                    checked={selectedId === option.id}
                    disabled={alreadySubmitted || submittingId === question.id}
                    onChange={() =>
                      setSelectedByQuestion((prev) => ({ ...prev, [question.id]: option.id }))
                    }
                    className="mt-1"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>

            {!alreadySubmitted ? (
              <button
                type="button"
                disabled={!selectedId || submittingId === question.id}
                onClick={() => handleSubmit(question.id)}
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {submittingId === question.id ? "Checking..." : "Check answer"}
              </button>
            ) : (
              <div
                role="status"
                aria-live="polite"
                className={`rounded-md border p-4 text-sm ${
                  feedback.isCorrect
                    ? "border-emerald-500/40 bg-emerald-500/5 text-foreground"
                    : "border-amber-500/40 bg-amber-500/5 text-foreground"
                }`}
              >
                <p className="font-semibold">
                  {feedback.isCorrect ? "Correct" : "Not quite — review the explanation below"}
                </p>
                <p className="mt-1 leading-6 text-muted-foreground">{feedback.explanation}</p>
                {feedback.sourceReference ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Reference: {feedback.sourceReference}
                  </p>
                ) : null}
              </div>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
