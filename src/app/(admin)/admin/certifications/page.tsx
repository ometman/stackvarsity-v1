import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageRole } from "@/modules/auth/route-guards";
import { listStaffTracks } from "@/modules/certification/services/track-authoring-service";

export const metadata: Metadata = {
  title: "Admin Certification Governance",
  robots: { index: false, follow: false },
};

async function AdminCertificationsContent() {
  await requirePageRole(["ADMIN"], "/admin/certifications");
  const tracks = await listStaffTracks();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div>
        <Badge variant="outline">MFA-Verified Admin Governance</Badge>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Certification Catalogue Governance
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Oversee provider credentials, exam version verification, and track publication status.
        </p>
      </div>

      <div className="space-y-3">
        {tracks.map((track) => (
          <Card key={track.id}>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{track.examVersion.certification.provider.name}</Badge>
                  <Badge variant="outline">{track.status}</Badge>
                  <Badge variant="outline">{track.examVersion.verificationStatus}</Badge>
                </div>
                <CardTitle className="mt-2 text-base">{track.title}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {track.examVersion.examCode} · {track._count.enrollments} enrolled learners ·{" "}
                  {track._count.resourceMappings} resource mappings
                </p>
              </div>
              <Link
                href={`/instructor/certifications/${track.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                Inspect track
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminCertificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
          Loading certification governance...
        </div>
      }
    >
      <AdminCertificationsContent />
    </Suspense>
  );
}
