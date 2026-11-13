import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy (Draft)",
  description:
    "Draft privacy notice for Stack Varsity V1, pending formal legal review prior to production launch.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <Badge variant="outline">Draft — Pending Legal Review</Badge>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        <strong>Notice:</strong> This document is a pre-launch transparency draft and has not yet
        undergone formal legal approval. Approved legal text is required before live public
        production launch.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Scope &amp; Purpose</h2>
          <p className="mt-2">
            Stack Varsity ({siteConfig.domain}) collects only the minimum personal information
            needed to operate account authentication (name, email address, hashed credentials) and
            respond to visitor inquiries.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Analytics &amp; Tracking</h2>
          <p className="mt-2">
            Third-party behavioral analytics and advertising trackers are disabled on this platform
            until an approved privacy policy, provider, and consent mechanism are finalized.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Contact</h2>
          <p className="mt-2">
            For privacy questions or data inquiries, contact{" "}
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {siteConfig.contactEmail}
            </a>{" "}
            or visit our{" "}
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
