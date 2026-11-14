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

interface CertificationsPageProps {
  searchParams?: Promise<{
    issuer?: string;
    level?: string;
    q?: string;
  }>;
}

export default async function CertificationsPage(props: CertificationsPageProps = {}) {
  const params = props.searchParams ? await props.searchParams : {};
  const tracks = await listCertificationTracks({
    issuer: params.issuer,
    level: params.level,
    q: params.q,
  });

  const hasFilters = Boolean(
    (params.issuer && params.issuer !== "all") ||
      (params.level && params.level !== "all") ||
      params.q?.trim()
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div className="max-w-3xl">
        <Badge variant="outline">Independent Exam Preparation</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Certification Preparation Directory
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Structured study pathways, sourced exam objective outlines, and formative knowledge checks
          designed to help candidates prepare for third-party professional IT certifications.
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

      <form
        method="get"
        action="/certifications"
        aria-label="Filter certification tracks"
        className="mt-8 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-4"
      >
        <div className="sm:col-span-2">
          <label htmlFor="cert-search" className="sr-only">
            Search certifications
          </label>
          <input
            id="cert-search"
            name="q"
            type="search"
            defaultValue={params.q ?? ""}
            placeholder="Search by credential, exam code, or topic..."
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
          />
        </div>
        <div>
          <label htmlFor="cert-issuer" className="sr-only">
            Provider
          </label>
          <select
            id="cert-issuer"
            name="issuer"
            defaultValue={params.issuer ?? "all"}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="all">All providers</option>
            <option value="Amazon Web Services (AWS)">Amazon Web Services (AWS)</option>
            <option value="CompTIA">CompTIA</option>
            <option value="Microsoft">Microsoft</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex h-10 flex-1 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Filter
          </button>
          {hasFilters ? (
            <Link
              href="/certifications"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border px-3 text-sm font-medium text-foreground hover:bg-accent"
            >
              Reset
            </Link>
          ) : null}
        </div>
      </form>

      {tracks.length === 0 ? (
        <div className="mt-10 rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-base font-medium text-foreground">
            No published certification tracks matched your filter.
          </p>
          <Link
            href="/certifications"
            className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            View all certification tracks
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {tracks.map((track) => (
            <Card key={track.id} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{track.issuer}</Badge>
                  <Badge variant="outline">{track.availability}</Badge>
                  {track.examCode ? <Badge variant="outline">{track.examCode}</Badge> : null}
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
      )}
    </div>
  );
}
