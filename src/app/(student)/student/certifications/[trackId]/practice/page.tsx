import { ArrowLeft, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { requirePageRole } from "@/modules/auth/route-guards";
import { PracticeSessionClient } from "@/modules/certification/components/practice-session-client";
import { getLearnerTrackWorkspace } from "@/modules/certification/services/learner-track-service";
import { startOrResumePracticeSession } from "@/modules/certification/services/practice-session-service";
import { CertificationServiceError } from "@/modules/certification/services/track-errors";

export const metadata: Metadata = {
  title: "Formative Practice",
  robots: { index: false, follow: false },
};

interface PracticePageProps {
  params: Promise<{ trackId: string }>;
}

async function PracticePageContent({ trackId }: { trackId: string }) {
  await requirePageRole(["STUDENT", "ADMIN"], `/student/certifications/${trackId}/practice`);

  let workspace;
  try {
    workspace = await getLearnerTrackWorkspace(trackId);
  } catch (error) {
    if (error instanceof CertificationServiceError && error.statusCode === 404) {
      notFound();
    }
    throw error;
  }

  if (!workspace.enrollment) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-10">
        <Link
          href={`/student/certifications/${trackId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to {workspace.track.title}
        </Link>
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          Join this preparation track in the workspace first before starting formative practice.
        </div>
      </div>
    );
  }

  const sessionData = await startOrResumePracticeSession(trackId);

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
        <Badge variant="outline">Formative Practice / Knowledge Check</Badge>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          {workspace.track.title} — Practice
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Self-paced, untimed knowledge checks with immediate explanations.
        </p>
      </div>

      <div
        role="note"
        className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground"
      >
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
        <p>
          These items are original illustrative formative checks for learning reinforcement. They
          are not official vendor exam questions and do not produce an official pass/fail score.
        </p>
      </div>

      <PracticeSessionClient
        trackId={trackId}
        attemptId={sessionData.attemptId}
        questions={sessionData.questions}
        initialResponses={sessionData.responses}
      />
    </div>
  );
}

export default async function PracticePage({ params }: PracticePageProps) {
  const { trackId } = await params;
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-muted-foreground">
          Loading formative practice...
        </div>
      }
    >
      <PracticePageContent trackId={trackId} />
    </Suspense>
  );
}
