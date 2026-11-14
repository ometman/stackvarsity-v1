import { ArrowLeft, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageRole } from "@/modules/auth/route-guards";
import { getLearnerTrackCoverage } from "@/modules/certification/services/coverage-service";
import { getLearnerPracticeReview } from "@/modules/certification/services/practice-session-service";
import { CertificationServiceError } from "@/modules/certification/services/track-errors";

export const metadata: Metadata = {
  title: "Coverage & Practice Review",
  robots: { index: false, follow: false },
};

interface ReviewPageProps {
  params: Promise<{ trackId: string }>;
}

async function ReviewPageContent({ trackId }: { trackId: string }) {
  await requirePageRole(["STUDENT", "ADMIN"], `/student/certifications/${trackId}/review`);

  let coverage;
  try {
    coverage = await getLearnerTrackCoverage(trackId);
  } catch (error) {
    if (error instanceof CertificationServiceError && error.statusCode === 404) {
      notFound();
    }
    throw error;
  }

  const history = await getLearnerPracticeReview(trackId);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <Link
        href={`/student/certifications/${trackId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to {coverage.track.title}
      </Link>

      <div>
        <Badge variant="outline">Learning Coverage &amp; Review</Badge>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          {coverage.track.title} — Coverage Insights
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Study progress, task completion, and formative practice activity are tracked separately.
        </p>
      </div>

      <div
        role="note"
        className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground"
      >
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
        <p>
          Coverage metrics reflect completed mapped lessons and self-paced formative checks only.
          They are not an official exam readiness score or pass-probability guarantee.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Study Plan Completion</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {coverage.studyPlanSummary.totalTasks > 0 ? (
              <p>
                <strong className="text-foreground">
                  {coverage.studyPlanSummary.completedTasks} /{" "}
                  {coverage.studyPlanSummary.totalTasks}
                </strong>{" "}
                tasks completed ({coverage.studyPlanSummary.completionPercent}%)
              </p>
            ) : (
              <p>No personal study plan created yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Formative Check Activity</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {coverage.practiceSummary.answeredCount > 0 ? (
              <div className="space-y-1">
                <p>
                  <strong className="text-foreground">
                    {coverage.practiceSummary.correctCount} /{" "}
                    {coverage.practiceSummary.answeredCount}
                  </strong>{" "}
                  correct ({coverage.practiceSummary.accuracyPercent}%)
                </p>
                {coverage.practiceSummary.answeredCount < 5 ? (
                  <p className="text-xs">Small sample size (&lt; 5 items answered).</p>
                ) : null}
              </div>
            ) : (
              <p>No formative practice items answered yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="domain-coverage-heading" className="space-y-3">
        <h2 id="domain-coverage-heading" className="text-lg font-semibold text-foreground">
          Domain breakdown
        </h2>
        <div className="space-y-3">
          {coverage.domainSummaries.map((dom) => (
            <Card key={dom.domainId}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {dom.domainKey}: {dom.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Mapped lessons:{" "}
                    {dom.mappedLessonCount > 0
                      ? `${dom.completedLessonCount}/${dom.mappedLessonCount} (${dom.lessonCoveragePercent}%)`
                      : "None mapped"}
                    {" · "}
                    Formative checks:{" "}
                    {dom.practiceAnsweredCount > 0
                      ? `${dom.practiceCorrectCount}/${dom.practiceAnsweredCount} (${dom.practiceAccuracyPercent}%)`
                      : "0 answered"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {coverage.recommendations.length > 0 ? (
        <section aria-labelledby="next-actions-heading" className="space-y-3">
          <h2 id="next-actions-heading" className="text-lg font-semibold text-foreground">
            What to study next
          </h2>
          <ul className="space-y-2">
            {coverage.recommendations.map((rec) => (
              <li
                key={`${rec.objectiveId}-${rec.reason}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card p-3 text-sm"
              >
                <div>
                  <span className="font-medium text-foreground">
                    {rec.objectiveKey}: {rec.objectiveTitle}
                  </span>
                  <p className="text-xs text-muted-foreground">{rec.reason}</p>
                </div>
                <Link
                  href={rec.actionHref}
                  className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  Open →
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="practice-history-heading" className="space-y-3">
        <h2 id="practice-history-heading" className="text-lg font-semibold text-foreground">
          Recent formative responses
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No formative responses recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <Card key={item.id}>
                <CardContent className="space-y-2 py-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant={item.isCorrect ? "secondary" : "outline"}>
                      {item.isCorrect ? "Correct" : "Needs review"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Objective {item.question.objective.objectiveKey}
                      {item.question.status === "RETIRED" ? " · Item retired" : ""}
                    </span>
                  </div>
                  <p className="font-medium text-foreground">{item.question.stem}</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {item.question.explanation}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { trackId } = await params;
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground">
          Loading coverage insights...
        </div>
      }
    >
      <ReviewPageContent trackId={trackId} />
    </Suspense>
  );
}
