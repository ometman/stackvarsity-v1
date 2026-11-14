import { ArrowLeft, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageRole } from "@/modules/auth/route-guards";
import { getTrackGovernanceSummary } from "@/modules/certification/services/coverage-service";
import { listStaffTrackQuestions } from "@/modules/certification/services/question-authoring-service";
import { getStaffTrackDetail } from "@/modules/certification/services/track-authoring-service";
import { CertificationServiceError } from "@/modules/certification/services/track-errors";

export const metadata: Metadata = {
  title: "Track Editorial Workspace",
  robots: { index: false, follow: false },
};

interface StaffTrackPageProps {
  params: Promise<{ trackId: string }>;
}

async function StaffTrackContent({ trackId }: { trackId: string }) {
  await requirePageRole(["INSTRUCTOR", "ADMIN"], `/instructor/certifications/${trackId}`);

  let track;
  let governance;
  let questions;
  try {
    [track, governance, questions] = await Promise.all([
      getStaffTrackDetail(trackId),
      getTrackGovernanceSummary(trackId),
      listStaffTrackQuestions(trackId),
    ]);
  } catch (error) {
    if (error instanceof CertificationServiceError && error.statusCode === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <Link
        href="/instructor/certifications"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to assigned tracks
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{track.examVersion.certification.provider.name}</Badge>
            <Badge variant="outline">{track.status}</Badge>
            <Badge variant="outline">Rev {track.revision}</Badge>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {track.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {track.examVersion.examCode} · {track.examVersion.versionLabel}
          </p>
        </div>
      </div>

      {(governance.staleMappingCount > 0 ||
        governance.examVerificationStatus !== "VERIFIED" ||
        governance.unmappedObjectiveCount > 0) && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-foreground"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="space-y-1 text-xs">
            <p className="font-semibold">Content governance attention</p>
            <p>
              Stale mappings: {governance.staleMappingCount} · Unmapped objectives:{" "}
              {governance.unmappedObjectiveCount} · Exam verification:{" "}
              {governance.examVerificationStatus}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Objectives</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{governance.totalObjectives}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Published Questions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {governance.questionCounts.published}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Questions in Review</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {governance.questionCounts.inReview}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Stale Mappings</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {governance.staleMappingCount}
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="questions-heading" className="space-y-3">
        <h2 id="questions-heading" className="text-lg font-semibold text-foreground">
          Formative Question Bank ({questions.length})
        </h2>
        <div className="space-y-3">
          {questions.map((q) => (
            <Card key={q.id}>
              <CardContent className="space-y-1 py-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="outline">{q.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Objective {q.objective.objectiveKey} · {q.originType}
                  </span>
                </div>
                <p className="font-medium text-foreground">{q.stem}</p>
                <p className="text-xs text-muted-foreground">{q.licenseNote}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default async function StaffTrackPage({ params }: StaffTrackPageProps) {
  const { trackId } = await params;
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
          Loading editorial workspace...
        </div>
      }
    >
      <StaffTrackContent trackId={trackId} />
    </Suspense>
  );
}
