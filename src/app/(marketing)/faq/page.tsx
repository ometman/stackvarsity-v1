import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { Badge } from "@/components/ui/badge";
import { faqCategories } from "@/config/company-content";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about Stack Varsity courses, independent certification preparation, account registration, and platform status.",
  alternates: {
    canonical: "/faq",
  },
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <div>
        <Badge variant="outline">Support &amp; Clarity</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Straightforward answers about what is available today, how independent exam preparation
          works, and how to reach our team.
        </p>
      </div>

      <div className="mt-10">
        <FaqAccordion categories={faqCategories} />
      </div>

      <div className="mt-12 rounded-lg border border-border bg-muted/30 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-foreground">Still have a question?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Contact us via our{" "}
          <Link
            href="/contact"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Contact page
          </Link>{" "}
          or email{" "}
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {siteConfig.contactEmail}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
