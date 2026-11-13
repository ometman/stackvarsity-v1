import Link from "next/link";
import { footerSections } from "@/config/navigation";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="text-base font-semibold tracking-tight text-foreground">
              {siteConfig.name}
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">{siteConfig.tagline}</p>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Practical digital skills education and independent professional certification exam
              preparation.
            </p>
            <p className="mt-4 text-sm">
              <span className="text-muted-foreground">Contact: </span>
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {siteConfig.contactEmail}
              </a>
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; 2026 Stack Varsity. All rights reserved.</p>
          <p>
            Independent training &amp; exam preparation. Third-party certification marks belong to
            their respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
