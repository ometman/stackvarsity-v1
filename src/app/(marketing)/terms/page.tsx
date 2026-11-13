import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Use (Draft)",
  description:
    "Draft terms of use for Stack Varsity V1, pending formal legal review prior to production launch.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <Badge variant="outline">Draft — Pending Legal Review</Badge>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Terms of Use
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        <strong>Notice:</strong> These terms are a pre-launch draft pending formal legal review and
        do not represent final binding commercial terms.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Educational Scope</h2>
          <p className="mt-2">
            Stack Varsity provides independent digital skills education and exam-preparation
            resources. We do not issue official third-party vendor certifications or guarantee
            examination or employment outcomes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Preview Offerings</h2>
          <p className="mt-2">
            Courses and certification tracks labeled &ldquo;Preview / Upcoming&rdquo; are
            informational outlines while the learning and assessment modules are finalized. No paid
            enrollment is active during Phase 3.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Questions</h2>
          <p className="mt-2">
            Direct questions regarding these draft terms to{" "}
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {siteConfig.contactEmail}
            </a>{" "}
            or via the{" "}
            <Link
              href="/contact"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Contact page
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
