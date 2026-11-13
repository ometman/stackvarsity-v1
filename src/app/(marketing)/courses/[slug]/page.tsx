import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildBreadcrumbJsonLd, serializeJsonLd } from "@/lib/seo/structured-data";
import {
  getPublicCourseBySlug,
  listPublicCourseSlugs,
} from "@/modules/catalog/services/catalog-service";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await listPublicCourseSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: CourseDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);

  if (!course) {
    return {
      title: "Course Not Found",
    };
  }

  return {
    title: course.title,
    description: course.summary,
    alternates: {
      canonical: `/courses/${course.slug}`,
    },
    openGraph: {
      title: `${course.title} | Stack Varsity`,
      description: course.summary,
      url: `/courses/${course.slug}`,
      type: "article",
    },
  };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Courses", path: "/courses" },
    { name: course.title, path: `/courses/${course.slug}` },
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      {/* Breadcrumb */}
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
            <Link href="/courses" className="hover:text-foreground">
              Courses
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li aria-current="page" className="font-medium text-foreground">
            {course.title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-10 lg:col-span-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{course.category}</Badge>
              <Badge variant="outline">{course.availability}</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {course.title}
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{course.overview}</p>
          </div>

          <section aria-labelledby="outcomes-heading">
            <h2 id="outcomes-heading" className="text-xl font-semibold text-foreground">
              What you will learn
            </h2>
            <ul className="mt-4 space-y-3">
              {course.learningOutcomes.map((outcome) => (
                <li key={outcome} className="flex items-start gap-2.5 text-sm leading-6">
                  <CheckCircle2
                    className="mt-1 h-4 w-4 shrink-0 text-foreground"
                    aria-hidden="true"
                  />
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="audience-heading" className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle id="audience-heading" className="text-base">
                  Intended audience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
                  {course.intendedAudience.map((item) => (
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
                  {course.prerequisites.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="outline-heading">
            <h2 id="outline-heading" className="text-xl font-semibold text-foreground">
              Planned module outline
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Provisional structure subject to curriculum review before enrollment opens.
            </p>
            <ol className="mt-4 space-y-2">
              {course.plannedModules.map((mod) => (
                <li
                  key={mod}
                  className="rounded-md border border-border bg-card px-4 py-3 text-sm font-medium text-foreground"
                >
                  {mod}
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Sidebar CTA */}
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-2 border-b border-border pb-2">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium text-foreground">{course.availability}</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-border pb-2">
                  <dt className="text-muted-foreground">Level</dt>
                  <dd className="font-medium text-foreground">{course.level}</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-border pb-2">
                  <dt className="text-muted-foreground">Format</dt>
                  <dd className="font-medium text-foreground">{course.modality}</dd>
                </div>
              </dl>

              <p className="text-xs leading-5 text-muted-foreground">
                This course is currently in preview. Paid enrollment and interactive lessons will
                open in an upcoming release.
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
                  href="/login"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent"
                >
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>

          {course.relatedCertificationSlug ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Related certification prep</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This course builds foundational knowledge for an independent exam-preparation
                  track.
                </p>
                <Link
                  href={`/certifications/${course.relatedCertificationSlug}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  View certification track
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          ) : null}

          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to course catalog
          </Link>
        </aside>
      </div>
    </div>
  );
}
