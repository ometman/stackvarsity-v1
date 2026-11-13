import { ArrowRight, BookOpen, CheckCircle2, Compass, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  featuredPreviewItems,
  homeFaqPreview,
  homeReasons,
  learningJourneySteps,
  offeringPillars,
} from "@/config/marketing-content";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="border-b border-border bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              {siteConfig.tagline}
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Practical digital skills education and focused certification exam preparation.
            </h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              Stack Varsity helps learners in Ghana and beyond build foundational technology skills
              across AI, cloud, Linux, networking, cybersecurity, and web development—while
              preparing methodically for professional IT examinations.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/courses"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Explore courses
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/certifications"
                className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                View certification tracks
              </Link>
              <Link
                href="/register"
                className="inline-flex h-11 items-center justify-center px-3 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Create free account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Two Core Educational Pillars */}
      <section
        aria-labelledby="pillars-heading"
        className="border-b border-border bg-muted/30 py-16"
      >
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeader
            headingId="pillars-heading"
            eyebrow="Educational Focus"
            title="Two complementary paths to technical readiness"
            description="Whether you are building core digital fluency or preparing for an industry certification exam, every track is structured around clear objectives."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {offeringPillars.map((pillar, index) => (
              <Card key={pillar.title} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background">
                    {index === 0 ? (
                      <BookOpen className="h-4 w-4 text-foreground" aria-hidden="true" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-foreground" aria-hidden="true" />
                    )}
                  </div>
                  <CardTitle className="text-xl">{pillar.title}</CardTitle>
                  <CardDescription className="text-sm leading-6">
                    {pillar.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-6">
                  <ul className="space-y-2 text-sm text-foreground">
                    {pillar.topics.map((topic) => (
                      <li key={topic} className="flex items-start gap-2">
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                  <div>
                    <Link
                      href={pillar.href}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {pillar.ctaLabel}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Process */}
      <section
        aria-labelledby="journey-heading"
        className="border-b border-border bg-background py-16"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <SectionHeader
              headingId="journey-heading"
              eyebrow="How It Works"
              title="A clear progression from discovery to exam readiness"
              description="Account registration and catalog discovery are live today; interactive lessons and timed mock exams are in active development."
            />
            <Link
              href="/how-it-works"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              Read full guide
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {learningJourneySteps.map((item) => (
              <Card key={item.step}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      STEP {item.step}
                    </span>
                    <Badge variant={item.status === "Available" ? "secondary" : "outline"}>
                      {item.status}
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Preview Catalog */}
      <section
        aria-labelledby="featured-heading"
        className="border-b border-border bg-muted/30 py-16"
      >
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <SectionHeader
              headingId="featured-heading"
              eyebrow="Catalog Preview"
              title="Featured upcoming courses & preparation tracks"
              description="Preview our planned curriculum structure. Items marked Preview / Upcoming are not yet open for paid enrollment."
            />
            <Link
              href="/courses"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              View all courses
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featuredPreviewItems.map((item) => (
              <Card key={item.slug} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{item.kind}</Badge>
                    <Badge variant="outline">{item.statusLabel}</Badge>
                  </div>
                  <CardTitle className="mt-3 text-lg">{item.title}</CardTitle>
                  <CardDescription className="text-sm leading-6">{item.summary}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs font-medium text-muted-foreground">
                    Level: {item.level}
                  </span>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    View details
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Stack Varsity */}
      <section
        aria-labelledby="trust-heading"
        className="border-b border-border bg-background py-16"
      >
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeader
            headingId="trust-heading"
            eyebrow="Our Commitment"
            title="Built on clarity, honesty, and practical rigor"
          />

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {homeReasons.map((reason) => (
              <div key={reason.title} className="rounded-lg border border-border bg-card p-6">
                <Compass className="h-5 w-5 text-foreground" aria-hidden="true" />
                <h3 className="mt-4 text-base font-semibold text-foreground">{reason.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Preview & Final CTA */}
      <section aria-labelledby="faq-heading" className="bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <SectionHeader
              headingId="faq-heading"
              eyebrow="Questions & Answers"
              title="Frequently asked questions"
            />
            <Link
              href="/faq"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              All FAQs
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {homeFaqPreview.map((faq) => (
              <div key={faq.question} className="rounded-lg border border-border bg-card p-5">
                <h3 className="text-sm font-semibold text-foreground">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-lg border border-border bg-card p-8 text-center sm:p-10">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Ready to start your learning journey?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Create your Stack Varsity account to stay ready as courses and exam-preparation tracks
              open, or reach out with questions at {siteConfig.contactEmail}.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Create free account
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground hover:bg-accent"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
