import { ArrowLeft, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCertificationTrackBySlug } from "@/modules/certification/services/certification-service";

interface ObjectivesPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ObjectivesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const track = await getCertificationTrackBySlug(slug);
  if (!track) {
    return { title: "Objectives Not Found" };
  }
  return {
    title: `${track.title} — Exam Objectives`,
    description: `Domain and objective outline for ${track.targetCertification}.`,
    alternates: { canonical: `/certifications/${track.slug}/objectives` },
  };
}

export default async function CertificationObjectivesPage({ params }: ObjectivesPageProps) {
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
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{track.issuer}</Badge>
          {track.examCode ? <Badge variant="outline">{track.examCode}</Badge> : null}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          {track.title} — Objective Outline
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Target external exam: {track.targetCertification}
          {track.versionLabel ? ` (${track.versionLabel})` : ""}
        </p>
      </div>

      <div
        role="note"
        className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground"
      >
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
        <p>{track.disclaimer}</p>
      </div>

      <div className="mt-8 space-y-6">
        {(track.domains ?? []).map((domain) => (
          <Card key={domain.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-lg">
                  {domain.domainKey}: {domain.title}
                </CardTitle>
                {domain.weightMinPercent != null && domain.weightMaxPercent != null ? (
                  <Badge variant="outline">
                    {domain.weightMinPercent}–{domain.weightMaxPercent}%
                  </Badge>
                ) : null}
              </div>
              {domain.description ? (
                <p className="text-sm text-muted-foreground">{domain.description}</p>
              ) : null}
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {domain.objectives.map((obj) => (
                  <li key={obj.id} className="rounded-md border border-border bg-background p-3">
                    <p className="text-sm font-medium text-foreground">
                      <span className="mr-2 font-mono text-xs text-muted-foreground">
                        {obj.objectiveKey}
                      </span>
                      {obj.title}
                    </p>
                    {obj.summary ? (
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{obj.summary}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
