import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { aboutValues } from "@/config/company-content";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Stack Varsity's mission to deliver practical digital skills education and honest professional certification exam preparation.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div className="max-w-3xl">
        <Badge variant="secondary">{siteConfig.tagline}</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          About Stack Varsity
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Stack Varsity is a digital skills education and professional IT certification
          examination-preparation platform built to serve beginners, university students, career
          changers, and working professionals in Ghana and beyond.
        </p>
      </div>

      <section aria-labelledby="mission-heading" className="mt-12 grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle id="mission-heading" className="text-xl">
              Our mission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Technology careers and modern workplaces increasingly require verified practical
              fluency across cloud systems, AI workflows, networking, cybersecurity, and software
              fundamentals.
            </p>
            <p>
              Our mission is to organize those topics into clear, structured learning paths and
              methodical exam-preparation tracks—without hype, inflated promises, or hidden
              prerequisites.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Independent preparation standards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Stack Varsity provides independent training and exam preparation. We do not issue
              third-party vendor certifications, nor do we claim official partnerships or
              endorsements from certification bodies unless explicitly established and verified.
            </p>
            <p>
              For inquiries, reach our team directly at{" "}
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {siteConfig.contactEmail}
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="values-heading" className="mt-14">
        <h2 id="values-heading" className="text-2xl font-semibold tracking-tight text-foreground">
          How we approach learning
        </h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {aboutValues.map((value) => (
            <Card key={value.title}>
              <CardHeader>
                <CardTitle className="text-base">{value.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="mt-14 flex flex-wrap gap-3 border-t border-border pt-8">
        <Link
          href="/courses"
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Explore courses
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link
          href="/certifications"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground hover:bg-accent"
        >
          Certification tracks
        </Link>
        <Link
          href="/contact"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground hover:bg-accent"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
