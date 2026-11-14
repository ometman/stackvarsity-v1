"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface StudyTaskDto {
  id: string;
  title: string;
  description: string | null;
  dueDateIso: string;
  dueDateLabel: string;
  estimatedMinutes: number;
  status: "PENDING" | "COMPLETED" | "SKIPPED";
}

interface StudyPlanDto {
  id: string;
  timezone: string;
  startDateIso: string;
  weeklyHours: number;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  tasks: StudyTaskDto[];
}

interface StudyPlanClientProps {
  trackId: string;
  initialPlan: StudyPlanDto | null;
}

export function StudyPlanClient({ trackId, initialPlan }: StudyPlanClientProps) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(
    initialPlan?.startDateIso.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  );
  const [timezone, setTimezone] = useState(initialPlan?.timezone ?? "UTC");
  const [weeklyHours, setWeeklyHours] = useState(initialPlan?.weeklyHours ?? 5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completedCount = initialPlan?.tasks.filter((t) => t.status === "COMPLETED").length ?? 0;
  const totalCount = initialPlan?.tasks.length ?? 0;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  async function handleCreatePlan(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/certifications/${trackId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, timezone, weeklyHours }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Unable to create study plan.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error while creating study plan.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReschedule(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/certifications/${trackId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", newStartDate: startDate, timezone }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Unable to reschedule study plan.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error while rescheduling study plan.");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleTask(taskId: string, nextCompleted: boolean) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/certifications/${trackId}/plan/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: nextCompleted }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Unable to update task.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error while updating study task.");
    } finally {
      setBusy(false);
    }
  }

  if (!initialPlan) {
    return (
      <form
        onSubmit={handleCreatePlan}
        className="space-y-4 rounded-lg border border-border bg-card p-6"
      >
        <h2 className="text-lg font-semibold text-foreground">Create your study schedule</h2>
        <p className="text-sm text-muted-foreground">
          Generate a personal study plan from this track&apos;s verified exam domains.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="plan-start-date" className="block text-xs font-medium text-foreground">
              Start date
            </label>
            <input
              id="plan-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            />
          </div>
          <div>
            <label htmlFor="plan-timezone" className="block text-xs font-medium text-foreground">
              Timezone (IANA)
            </label>
            <select
              id="plan-timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="UTC">UTC</option>
              <option value="Africa/Accra">Africa/Accra</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
            </select>
          </div>
          <div>
            <label htmlFor="plan-hours" className="block text-xs font-medium text-foreground">
              Weekly hours
            </label>
            <input
              id="plan-hours"
              type="number"
              min={1}
              max={40}
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(Number(e.target.value))}
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            />
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Generating plan..." : "Generate study plan"}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{initialPlan.status}</Badge>
              <span className="text-xs text-muted-foreground">
                Timezone: {initialPlan.timezone}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">
              Task completion: {completedCount} of {totalCount} ({percent}%)
            </p>
          </div>

          <form onSubmit={handleReschedule} className="flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="reschedule-date" className="block text-xs text-muted-foreground">
                Reschedule start date (preserves completed tasks)
              </label>
              <input
                id="reschedule-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50"
            >
              Reschedule
            </button>
          </form>
        </div>

        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Study plan task completion"
          className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <ul className="space-y-3">
        {initialPlan.tasks.map((task) => {
          const isDone = task.status === "COMPLETED";
          return (
            <li
              key={task.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
            >
              <div className="space-y-1">
                <p
                  className={`text-sm font-medium ${
                    isDone ? "text-muted-foreground line-through" : "text-foreground"
                  }`}
                >
                  {task.title}
                </p>
                {task.description ? (
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Due: {task.dueDateLabel} · Est. {task.estimatedMinutes} min (editorial guidance)
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleToggleTask(task.id, !isDone)}
                className="inline-flex h-9 items-center rounded-md border border-border px-3 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50"
              >
                {isDone ? "Mark pending" : "Mark complete"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
