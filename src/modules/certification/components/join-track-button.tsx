"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface JoinTrackButtonProps {
  trackId: string;
  isPaid: boolean;
}

export function JoinTrackButton({ trackId, isPaid }: JoinTrackButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isPaid) {
    return (
      <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        Paid preparation track — checkout will be available in a future release.
      </div>
    );
  }

  async function handleJoin() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/certifications/${trackId}/join`, {
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not join preparation track.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error while joining preparation track.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleJoin}
        disabled={loading}
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Joining..." : "Join free preparation track"}
      </button>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
