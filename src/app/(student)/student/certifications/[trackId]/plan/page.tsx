import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requirePageRole } from "@/modules/auth/route-guards";
import { StudyPlanClient } from "@/modules/certification/components/study-plan-client";
import { getLearnerTrackWorkspace } from "@/modules/certification/services/learner-track-service";
import {
  formatDueDateInTimezone,
  getLearnerStudyPlan,
} from "@/modules/certification/services/study-plan-service";
import { CertificationServiceError } from "@/modules/certification/services/track-errors";

export const metadata: Metadata = {
  title: "Personal Study Plan",
  robots: { index: false, follow: false },
};

interface StudyPlanPageProps {
  params: Promise<{ trackId: string }>;
}

async function StudyPlanContent({ trackId }: { trackId: string }) {
  await requirePageRole(["STUDENT", "ADMIN"], `/student/certifications/${trackId}/plan`);

  let workspace;
  try {
    workspace = await getLearnerTrackWorkspace(trackId);
  } catch (error) {
    if (error instanceof CertificationServiceError && error.statusCode === 404) {
      notFound();
    }
    throw error;
  }

  const plan = await getLearnerStudyPlan(trackId);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <Link
        href={`/student/certifications/${trackId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to {workspace.track.title}
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {workspace.track.title} — Study Plan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track-aligned milestones with timezone-aware scheduling.
        </p>
      </div>

      {!workspace.enrollment ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Join this preparation track in the workspace first before creating a personal study plan.
        </div>
      ) : (
        <StudyPlanClient
          trackId={trackId}
          initialPlan={
            plan
              ? {
                  id: plan.id,
                  timezone: plan.timezone,
                  startDateIso: plan.startDate.toISOString(),
                  weeklyHours: plan.weeklyHours,
                  status: plan.status,
                  tasks: plan.tasks.map((t) => ({
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    dueDateIso: t.dueDate.toISOString(),
                    dueDateLabel: formatDueDateInTimezone(t.dueDate, plan.timezone),
                    estimatedMinutes: t.estimatedMinutes,
                    status: t.status,
                  })),
                }
              : null
          }
        />
      )}
    </div>
  );
}

export default async function StudyPlanPage({ params }: StudyPlanPageProps) {
  const { trackId } = await params;
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-muted-foreground">
          Loading study plan...
        </div>
      }
    >
      <StudyPlanContent trackId={trackId} />
    </Suspense>
  );
}
