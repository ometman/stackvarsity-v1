import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCertificationTrackBySlug,
  listCertificationSlugs,
} from "@/modules/certification/services/certification-service";

interface CertificationDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await listCertificationSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: CertificationDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const track = await getCertificationTrackBySlug(slug);

  if (!track) {
    return {
      title: "Certification Track Not Found",
    };
  }

  return {
    title: track.title,
    description: track.summary,
    alternates: {
      canonical: `/certifications/${track.slug}`,
    },
    openGraph: {
      title: `${track.title} | Stack Varsity`,
      description: track.summary,
      url: `/certifications/${track.slug}`,
      type: "article",
    },
  };
}

export default async function CertificationDetailPage({ params }: CertificationDetailPageProps) {
  const { slug } = await params;
  const track = await getCertificationTrackBySlug(slug);

  if (!track) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li>
            <Link href="/certifications" className="hover:text-foreground">
              Certifications
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li aria-current="page" className="font-medium text-foreground">
            {track.title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{track.issuer}</Badge>
              <Badge variant="outline">{track.availability}</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {track.title}
            </h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Target external exam: {track.targetCertification}
            </p>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{track.overview}</p>
          </div>

          <div
            role="note"
            className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground"
          >
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
            <p>{track.disclaimer}</p>
          </div>

          <section aria-labelledby="topics-heading">
            <h2 id="topics-heading" className="text-xl font-semibold text-foreground">
              Preparation focus areas
            </h2>
            <ul className="mt-4 space-y-3">
              {track.preparationTopics.map((topic) => (
                <li key={topic} className="flex items-start gap-2.5 text-sm leading-6">
                  <CheckCircle2
                    className="mt-1 h-4 w-4 shrink-0 text-foreground"
                    aria-hidden="true"
                  />
                  <span>{topic}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Who this track is for</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
                  {track.audience.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

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
          </section>

          <section aria-labelledby="pathway-heading">
            <h2 id="pathway-heading" className="text-xl font-semibold text-foreground">
              Learning pathway
            </h2>
            <ol className="mt-4 space-y-2">
              {track.learningPathway.map((step, index) => (
                <li
                  key={step}
                  className="rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground"
                >
                  <span className="mr-2 font-mono text-xs font-semibold text-muted-foreground">
                    0{index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Track summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-2 border-b border-border pb-2">
                  <dt className="text-muted-foreground">Issuer</dt>
                  <dd className="text-right font-medium text-foreground">{track.issuer}</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-border pb-2">
                  <dt className="text-muted-foreground">Level</dt>
                  <dd className="font-medium text-foreground">{track.level}</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-border pb-2">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium text-foreground">{track.availability}</dd>
                </div>
              </dl>

              <p className="text-xs leading-5 text-muted-foreground">
                Exam registration and official credentials are handled directly by {track.issuer}.
                Timed mock exams on Stack Varsity are scheduled for an upcoming release.
              </p>

              <div className="flex flex-col gap-2.5 pt-2">
                <Link
                  href="/register"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Create free account
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent"
                >
                  Ask a question
                </Link>
              </div>
            </CardContent>
          </Card>

          {track.relatedCourseSlug ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recommended foundation course</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Build core concepts before starting exam-focused practice.
                </p>
                <Link
                  href={`/courses/${track.relatedCourseSlug}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  View related course
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          ) : null}

          <Link
            href="/certifications"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to certification directory
          </Link>
        </aside>
      </div>
    </div>
  );
}
