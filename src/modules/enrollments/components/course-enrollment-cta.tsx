"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface CourseEnrollmentCtaProps {
  courseId: string;
  courseSlug: string;
  accessType?: "FREE" | "PAID";
  isAuthenticated: boolean;
  isEnrolled: boolean;
}

export function CourseEnrollmentCta({
  courseId,
  courseSlug,
  accessType = "FREE",
  isAuthenticated,
  isEnrolled,
}: CourseEnrollmentCtaProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnroll() {
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error ?? "Unable to complete enrollment.");
        setSubmitting(false);
        return;
      }
      router.push(`/learn/${courseSlug}`);
      router.refresh();
    } catch {
      setError("Network error while enrolling.");
      setSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-2.5 pt-2">
        <Link
          href="/register"
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Create free account
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          href={`/login?next=${encodeURIComponent(`/courses/${courseSlug}`)}`}
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent"
        >
          Sign in to enroll
        </Link>
      </div>
    );
  }

  if (isEnrolled) {
    return (
      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          <span>You are enrolled in this course</span>
        </div>
        <Link
          href={`/learn/${courseSlug}`}
          className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Continue learning
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  if (accessType === "PAID") {
    return (
      <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        Paid course enrollment will open in an upcoming release.
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-2">
      {error && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {error}
        </div>
      )}
      <Button type="button" className="w-full" disabled={submitting} onClick={handleEnroll}>
        {submitting ? "Enrolling..." : "Enroll for free"}
      </Button>
    </div>
  );
}
