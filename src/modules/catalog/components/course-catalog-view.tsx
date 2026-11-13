"use client";

import { ArrowRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COURSE_CATEGORIES, COURSE_LEVELS } from "@/modules/catalog/schemas/catalog-query";
import type { CatalogPageResult } from "@/modules/catalog/types/course";

interface CourseCatalogViewProps {
  result: CatalogPageResult;
}

export function CourseCatalogView({ result }: CourseCatalogViewProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(result.appliedFilters.q);

  function buildUrl(next: { q?: string; category?: string; level?: string; page?: number }) {
    const params = new URLSearchParams();
    const q = (next.q ?? result.appliedFilters.q).trim();
    const category = next.category ?? result.appliedFilters.category;
    const level = next.level ?? result.appliedFilters.level;
    const page = next.page ?? 1;

    if (q) params.set("q", q);
    if (category && category !== "all") params.set("category", category);
    if (level && level !== "all") params.set("level", level);
    if (page > 1) params.set("page", String(page));

    const queryString = params.toString();
    return queryString ? `/courses?${queryString}` : "/courses";
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(buildUrl({ q: searchInput, page: 1 }));
  }

  function handleReset() {
    setSearchInput("");
    router.push("/courses");
  }

  const hasActiveFilters =
    Boolean(result.appliedFilters.q) ||
    result.appliedFilters.category !== "all" ||
    result.appliedFilters.level !== "all";

  return (
    <div className="space-y-8">
      {/* Filter Controls */}
      <form
        onSubmit={handleSearchSubmit}
        role="search"
        aria-label="Filter courses"
        className="rounded-lg border border-border bg-card p-4 sm:p-6"
      >
        <div className="grid gap-4 md:grid-cols-12">
          <div className="space-y-1.5 md:col-span-5">
            <Label htmlFor="catalog-search">Search courses</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="catalog-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by topic or keyword..."
                maxLength={80}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-3">
            <Label htmlFor="catalog-category">Category</Label>
            <select
              id="catalog-category"
              value={result.appliedFilters.category}
              onChange={(event) => router.push(buildUrl({ category: event.target.value, page: 1 }))}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All categories</option>
              {COURSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="catalog-level">Level</Label>
            <select
              id="catalog-level"
              value={result.appliedFilters.level}
              onChange={(event) => router.push(buildUrl({ level: event.target.value, page: 1 }))}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All levels</option>
              {COURSE_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2 md:col-span-2">
            <Button type="submit" className="w-full">
              Search
            </Button>
          </div>
        </div>

        {hasActiveFilters ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
            <span>
              Showing {result.total} {result.total === 1 ? "course" : "courses"}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear filters
            </button>
          </div>
        ) : null}
      </form>

      {/* Results Grid or Empty State */}
      {result.items.length === 0 ? (
        <div role="status" className="rounded-lg border border-border bg-muted/30 p-10 text-center">
          <h2 className="text-lg font-semibold text-foreground">No matching courses found</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Try adjusting your search keywords or clearing your category and level filters.
          </p>
          <Button type="button" variant="outline" onClick={handleReset} className="mt-5">
            Reset filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {result.items.map((course) => (
            <Card key={course.id} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{course.category}</Badge>
                  <Badge variant="outline">{course.availability}</Badge>
                </div>
                <CardTitle className="mt-3 text-lg">{course.title}</CardTitle>
                <CardDescription className="text-sm leading-6">{course.summary}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between border-t border-border pt-4">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{course.level}</span>
                  {" · "}
                  <span>{course.modality}</span>
                </div>
                <Link
                  href={`/courses/${course.slug}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Details
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {result.totalPages > 1 ? (
        <nav
          aria-label="Catalog pagination"
          className="flex items-center justify-between border-t border-border pt-6"
        >
          <p className="text-sm text-muted-foreground">
            Page {result.page} of {result.totalPages}
          </p>
          <div className="flex items-center gap-2">
            {result.page > 1 ? (
              <Link
                href={buildUrl({ page: result.page - 1 })}
                className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-accent"
              >
                Previous
              </Link>
            ) : (
              <span className="inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-sm text-muted-foreground opacity-50">
                Previous
              </span>
            )}
            {result.page < result.totalPages ? (
              <Link
                href={buildUrl({ page: result.page + 1 })}
                className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-accent"
              >
                Next
              </Link>
            ) : (
              <span className="inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-sm text-muted-foreground opacity-50">
                Next
              </span>
            )}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
