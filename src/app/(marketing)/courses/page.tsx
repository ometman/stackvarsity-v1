import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { CourseCatalogView } from "@/modules/catalog/components/course-catalog-view";
import { queryPublicCatalog } from "@/modules/catalog/services/catalog-service";

export const metadata: Metadata = {
  title: "Course Catalog",
  description:
    "Explore Stack Varsity's upcoming digital skills courses across AI, cloud, Linux, networking, cybersecurity, web development, and data analytics.",
  alternates: {
    canonical: "/courses",
  },
};

interface CoursesPageProps {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
    level?: string | string[];
    page?: string | string[];
  }>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function CoursesCatalogLoader({ searchParams }: CoursesPageProps) {
  const resolved = await searchParams;
  const pageRaw = firstParam(resolved.page);
  const result = await queryPublicCatalog({
    q: firstParam(resolved.q),
    category: firstParam(resolved.category),
    level: firstParam(resolved.level),
    page: pageRaw ? Number(pageRaw) : 1,
  });

  return <CourseCatalogView result={result} />;
}

export default function CoursesPage({ searchParams }: CoursesPageProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div className="max-w-3xl">
        <Badge variant="outline">Provisional Preview Catalog</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Digital Skills Course Catalog
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Browse our planned self-paced learning paths. Courses below are preview outlines while
          interactive lesson delivery is prepared for upcoming releases; no paid enrollment is
          active yet.
        </p>
      </div>

      <div className="mt-10">
        <Suspense
          fallback={
            <div className="rounded-lg border border-border bg-muted/20 p-8 text-sm text-muted-foreground">
              Loading course catalog...
            </div>
          }
        >
          <CoursesCatalogLoader searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
