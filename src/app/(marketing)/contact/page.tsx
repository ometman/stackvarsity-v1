import { Mail } from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { ContactForm } from "@/modules/contact/components/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Stack Varsity at hello@mystackvarsity.com for course, certification preparation, or platform questions.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <div className="max-w-3xl">
        <Badge variant="outline">Contact &amp; Support</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Contact Stack Varsity
        </h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Have questions about upcoming courses, independent certification preparation, or your
          account? Reach us directly by email or use the inquiry form below.
        </p>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Send an inquiry</CardTitle>
              <CardDescription>
                All submissions are validated server-side. In local or staging environments without
                an external email key, inquiries are captured locally rather than sent externally.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Direct email</CardTitle>
              <CardDescription>Preferred channel for urgent or formal inquiries.</CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-4 hover:opacity-80"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                {siteConfig.contactEmail}
              </a>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
