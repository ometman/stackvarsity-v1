import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageRole } from "@/modules/auth/route-guards";
import { listStaffTracks } from "@/modules/certification/services/track-authoring-service";

export const metadata: Metadata = {
  title: "Instructor Certification Tracks",
  robots: { index: false, follow: false },
};

async function InstructorCertificationsContent() {
  await requirePageRole(["INSTRUCTOR", "ADMIN"], "/instructor/certifications");
  const tracks = await listStaffTracks();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div>
        <Badge variant="outline">Staff Authoring</Badge>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Assigned Certification Tracks
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage exam blueprints, LMS objective mappings, and formative practice items within your
          assigned scope.
        </p>
      </div>

      {tracks.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No certification tracks are currently assigned to your account.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tracks.map((track) => (
            <Card key={track.id} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{track.examVersion.certification.provider.name}</Badge>
                  <Badge variant="outline">{track.status}</Badge>
                  <Badge variant="outline">{track.examVersion.examCode}</Badge>
                </div>
                <CardTitle className="mt-2 text-lg">{track.title}</CardTitle>
                <CardDescription>{track.summary}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                <span>
                  {track._count.resourceMappings} mappings · {track._count.enrollments} learners
                </span>
                <Link
                  href={`/instructor/certifications/${track.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Manage
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InstructorCertificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
          Loading assigned certification tracks...
        </div>
      }
    >
      <InstructorCertificationsContent />
    </Suspense>
  );
}
