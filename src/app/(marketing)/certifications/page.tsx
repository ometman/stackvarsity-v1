import { ArrowRight, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listCertificationTracks } from "@/modules/certification/services/certification-service";

export const metadata: Metadata = {
  title: "Certification Preparation",
  description:
    "Explore Stack Varsity's independent professional IT certification exam-preparation tracks with clear third-party issuer attribution.",
  alternates: {
    canonical: "/certifications",
  },
};

export default async function CertificationsPage() {
  const tracks = await listCertificationTracks();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div className="max-w-3xl">
        <Badge variant="outline">Independent Exam Preparation</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Certification Preparation Directory
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Structured study pathways and upcoming practice assessments designed to help candidates
          prepare for third-party professional IT certifications.
        </p>
      </div>

      {/* Explicit Non-Affiliation Disclaimer */}
      <div
        role="note"
        aria-label="Third-party certification disclaimer"
        className="mt-8 flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground"
      >
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
        <p>
          <strong className="font-semibold text-foreground">Important attribution notice:</strong>{" "}
          Stack Varsity provides independent training and exam preparation. We are not affiliated
          with, endorsed by, or an official testing partner of Amazon Web Services (AWS), CompTIA,
          Microsoft, or any third-party certification body. Official exams and credentials are
          issued solely by those organizations.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {tracks.map((track) => (
          <Card key={track.id} className="flex flex-col justify-between">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{track.issuer}</Badge>
                <Badge variant="outline">{track.availability}</Badge>
              </div>
              <CardTitle className="mt-3 text-xl">{track.title}</CardTitle>
              <CardDescription className="text-sm leading-6">{track.summary}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between border-t border-border pt-4">
              <div className="text-xs text-muted-foreground">
                <span>Target: {track.targetCertification}</span>
                {" · "}
                <span className="font-medium text-foreground">{track.level}</span>
              </div>
              <Link
                href={`/certifications/${track.slug}`}
                className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                View track
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
