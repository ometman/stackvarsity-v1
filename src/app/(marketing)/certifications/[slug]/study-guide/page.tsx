import { ArrowLeft, ArrowRight, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCertificationTrackBySlug } from "@/modules/certification/services/certification-service";

interface StudyGuidePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StudyGuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const track = await getCertificationTrackBySlug(slug);
  if (!track) {
    return { title: "Study Guide Not Found" };
  }
  return {
    title: `${track.title} — Study Guide`,
    description: `Public orientation and study strategy for ${track.targetCertification}.`,
    alternates: { canonical: `/certifications/${track.slug}/study-guide` },
  };
}

export default async function CertificationStudyGuidePage({ params }: StudyGuidePageProps) {
  const { slug } = await params;
  const track = await getCertificationTrackBySlug(slug);
  if (!track) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <Link
        href={`/certifications/${track.slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to {track.title}
      </Link>

      <div className="mt-6">
        <Badge variant="outline">Public Study Orientation</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          {track.title} — Study Guide
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{track.summary}</p>
      </div>

      <div
        role="note"
        className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground"
      >
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
        <p>{track.disclaimer}</p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prerequisites</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
              {track.prerequisites.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recommended Approach</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
              {track.learningPathway.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/student/certifications/${track.id}`}
          className="inline-flex h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Open learner workspace
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          href={`/certifications/${track.slug}/objectives`}
          className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium text-foreground hover:bg-accent"
        >
          View exam objectives
        </Link>
      </div>
    </div>
  );
}
