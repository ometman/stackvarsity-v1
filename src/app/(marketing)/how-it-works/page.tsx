import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { howItWorksStages } from "@/config/company-content";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "See how Stack Varsity guides learners from course discovery and account setup to upcoming interactive lessons and exam-readiness assessments.",
  alternates: {
    canonical: "/how-it-works",
  },
};

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div className="max-w-3xl">
        <Badge variant="outline">Learner Journey</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          How Stack Varsity Works
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          From discovering a learning path to preparing for professional examinations, each stage
          below clearly notes what is live today and what is scheduled for upcoming platform
          releases.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {howItWorksStages.map((stage) => (
          <Card key={stage.phase} className="flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  STAGE {stage.phase}
                </span>
                <Badge variant={stage.availability === "Live now" ? "secondary" : "outline"}>
                  {stage.availability}
                </Badge>
              </div>
              <CardTitle className="mt-2 text-xl">{stage.title}</CardTitle>
              <CardDescription className="text-sm leading-6">{stage.summary}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 text-sm text-foreground">
                {stage.details.map((detail) => (
                  <li key={detail} className="flex items-start gap-2">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-border bg-muted/30 p-8">
        <h2 className="text-xl font-semibold text-foreground">Start with the live stages today</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Explore the preview catalog and certification-prep directory, or create your free learner
          account to be ready when interactive lessons open.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Create free account
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/courses"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground hover:bg-accent"
          >
            Browse courses
          </Link>
          <Link
            href="/faq"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground hover:bg-accent"
          >
            Read FAQ
          </Link>
        </div>
      </div>
    </div>
  );
}
