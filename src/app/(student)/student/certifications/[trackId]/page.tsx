import { ArrowLeft, BookOpen, Lock, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageRole } from "@/modules/auth/route-guards";
import { JoinTrackButton } from "@/modules/certification/components/join-track-button";
import { getLearnerTrackWorkspace } from "@/modules/certification/services/learner-track-service";
import { CertificationServiceError } from "@/modules/certification/services/track-errors";

export const metadata: Metadata = {
  title: "Certification Track Workspace",
  robots: { index: false, follow: false },
};

interface TrackWorkspacePageProps {
  params: Promise<{ trackId: string }>;
}

async function TrackWorkspaceContent({ trackId }: { trackId: string }) {
  await requirePageRole(["STUDENT", "ADMIN"], `/student/certifications/${trackId}`);

  let workspace;
  try {
    workspace = await getLearnerTrackWorkspace(trackId);
  } catch (error) {
    if (error instanceof CertificationServiceError && error.statusCode === 404) {
      notFound();
    }
    throw error;
  }

  const { track, enrollment, mappings } = workspace;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div>
        <Link
          href="/student/certifications"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to my certifications
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{track.examVersion.certification.provider.name}</Badge>
              <Badge variant="outline">{track.examVersion.examCode}</Badge>
              {track.status === "RETIRED" ? (
                <Badge variant="destructive">Retired Exam Version</Badge>
              ) : null}
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {track.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {track.examVersion.certification.name} · {track.examVersion.versionLabel}
            </p>
          </div>

          {!enrollment ? (
            <JoinTrackButton trackId={track.id} isPaid={track.accessType === "PAID"} />
          ) : (
            <nav aria-label="Track workspace sections" className="flex flex-wrap gap-2">
              <Link
                href={`/student/certifications/${track.id}/plan`}
                className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-accent"
              >
                Study Plan
              </Link>
              <Link
                href={`/student/certifications/${track.id}/practice`}
                className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Formative Practice
              </Link>
              <Link
                href={`/student/certifications/${track.id}/review`}
                className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-accent"
              >
                Coverage &amp; Review
              </Link>
            </nav>
          )}
        </div>
      </div>

      {track.status === "RETIRED" ? (
        <div
          role="note"
          className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-foreground"
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            This certification track edition has been retired. Your historical study progress and
            practice responses are preserved, but check the directory for newer exam versions.
          </p>
        </div>
      ) : null}

      <div className="space-y-6">
        {track.examVersion.domains.map((domain) => (
          <Card key={domain.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                {domain.domainKey}: {domain.title}
              </CardTitle>
              {domain.description ? (
                <p className="text-sm text-muted-foreground">{domain.description}</p>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              {domain.objectives.map((obj) => {
                const objMappings = mappings.filter((m) => m.objectiveId === obj.id);
                return (
                  <div key={obj.id} className="rounded-md border border-border bg-background p-4">
                    <p className="text-sm font-medium text-foreground">
                      <span className="mr-2 font-mono text-xs text-muted-foreground">
                        {obj.objectiveKey}
                      </span>
                      {obj.title}
                    </p>
                    {obj.summary ? (
                      <p className="mt-1 text-xs text-muted-foreground">{obj.summary}</p>
                    ) : null}

                    {objMappings.length > 0 ? (
                      <ul className="mt-3 space-y-2 border-t border-border pt-3">
                        {objMappings.map((m) => (
                          <li
                            key={m.id}
                            className="flex flex-wrap items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                              <span className="font-medium text-foreground">
                                {m.lessonTitle ? `${m.courseTitle} — ${m.lessonTitle}` : m.courseTitle}
                              </span>
                              <Badge variant="outline">
                                {m.isRequired ? "Required" : "Optional"}
                              </Badge>
                            </div>
                            {m.isLockedPaid ? (
                              <span className="inline-flex items-center gap-1 text-muted-foreground">
                                <Lock className="h-3 w-3" aria-hidden="true" />
                                Paid course (Phase 7)
                              </span>
                            ) : m.isEnrolled ? (
                              <Link
                                href={
                                  m.lessonSlug
                                    ? `/learn/${m.courseSlug}/${m.lessonSlug}`
                                    : `/learn/${m.courseSlug}`
                                }
                                className="font-medium text-primary underline-offset-4 hover:underline"
                              >
                                Open lesson →
                              </Link>
                            ) : (
                              <Link
                                href={`/courses/${m.courseSlug}`}
                                className="font-medium text-foreground underline-offset-4 hover:underline"
                              >
                                Enroll in course →
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default async function TrackWorkspacePage({ params }: TrackWorkspacePageProps) {
  const { trackId } = await params;
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
          Loading track workspace...
        </div>
      }
    >
      <TrackWorkspaceContent trackId={trackId} />
    </Suspense>
  );
}
