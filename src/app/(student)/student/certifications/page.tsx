import { ArrowRight, Award, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageRole } from "@/modules/auth/route-guards";
import { listLearnerTracks } from "@/modules/certification/services/learner-track-service";

export const metadata: Metadata = {
  title: "My Certification Preparation",
  robots: { index: false, follow: false },
};

async function StudentCertificationsContent() {
  await requirePageRole(["STUDENT", "ADMIN"], "/student/certifications");
  const { enrollments, availableTracks } = await listLearnerTracks();

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Badge variant="outline">Learner Workspace</Badge>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Certification Preparation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your study plans, mapped LMS lessons, and formative knowledge checks.
          </p>
        </div>
        <Link
          href="/certifications"
          className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium text-foreground hover:bg-accent"
        >
          Browse public directory
        </Link>
      </div>

      <section aria-labelledby="active-tracks-heading" className="space-y-4">
        <h2 id="active-tracks-heading" className="text-lg font-semibold text-foreground">
          Your preparation tracks
        </h2>
        {enrollments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Award className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium text-foreground">
                You have not joined any certification preparation tracks yet.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Select an available track below to start organizing your study plan.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {enrollments.map(({ track, status }) => (
              <Card key={track.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{track.examVersion.certification.provider.name}</Badge>
                    <Badge variant="outline">{track.examVersion.examCode}</Badge>
                    {track.status === "RETIRED" ? (
                      <Badge variant="destructive">Retired Edition</Badge>
                    ) : (
                      <Badge variant="outline">{status}</Badge>
                    )}
                  </div>
                  <CardTitle className="mt-2 text-lg">{track.title}</CardTitle>
                  <CardDescription>{track.summary}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">
                    {track.examVersion.versionLabel}
                  </span>
                  <Link
                    href={`/student/certifications/${track.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Open workspace
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {availableTracks.length > 0 ? (
        <section aria-labelledby="available-tracks-heading" className="space-y-4">
          <h2 id="available-tracks-heading" className="text-lg font-semibold text-foreground">
            Available preparation tracks
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {availableTracks.map((track) => (
              <Card key={track.id} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{track.examVersion.certification.provider.name}</Badge>
                    <Badge variant="outline">{track.examVersion.examCode}</Badge>
                    <Badge variant="outline">
                      {track.accessType === "FREE" ? "Free" : "Paid (Phase 7)"}
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 text-lg">{track.title}</CardTitle>
                  <CardDescription>{track.summary}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs text-muted-foreground">
                    {track.examVersion.certification.level}
                  </span>
                  <Link
                    href={`/student/certifications/${track.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Inspect &amp; join
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <div
        role="note"
        className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground"
      >
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
        <p>
          Joining a preparation track organizes your study plan and formative practice. Restricted or
          paid LMS courses still require separate course enrollment.
        </p>
      </div>
    </div>
  );
}

export default function StudentCertificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
          Loading certification tracks...
        </div>
      }
    >
      <StudentCertificationsContent />
    </Suspense>
  );
}
