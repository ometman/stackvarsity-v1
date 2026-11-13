"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface LessonCompletionButtonProps {
  lessonId: string;
  initialCompleted: boolean;
}

export function LessonCompletionButton({
  lessonId,
  initialCompleted,
}: LessonCompletionButtonProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setBusy(true);
    setError(null);
    const nextState = !completed;

    try {
      const response = await fetch("/api/learning/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, completed: nextState }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error ?? "Unable to update lesson progress.");
        return;
      }

      setCompleted(payload.completed);
      router.refresh();
    } catch {
      setError("Network error while saving progress.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant={completed ? "secondary" : "outline"}
        size="sm"
        aria-pressed={completed}
        disabled={busy}
        onClick={handleToggle}
      >
        {completed ? (
          <>
            <CheckCircle2 className="mr-1.5 h-4 w-4 text-primary" aria-hidden="true" />
            Completed
          </>
        ) : (
          <>
            <Circle className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Mark Complete
          </>
        )}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
