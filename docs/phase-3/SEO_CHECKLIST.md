# Phase 3 — Technical SEO & Discoverability Checklist

**Canonical Domain:** `https://www.mystackvarsity.com`  
**Sitemap:** `/sitemap.xml` (`src/app/sitemap.ts`)  
**Robots:** `/robots.txt` (`src/app/robots.ts`)

---

## 1. Implemented Technical SEO Controls

- [x] Root `metadataBase` configured to `https://www.mystackvarsity.com` in `src/app/layout.tsx`.
- [x] Default title template (`%s | Stack Varsity`), description, Open Graph, and Twitter summary metadata configured.
- [x] Unique `title`, `description`, and `alternates.canonical` set on all public marketing pages (`/`, `/courses`, `/courses/[slug]`, `/certifications`, `/certifications/[slug]`, `/about`, `/how-it-works`, `/faq`, `/contact`).
- [x] Draft legal pages (`/privacy`, `/terms`) set `robots: { index: false, follow: true }` until formal legal approval is completed.
- [x] `sitemap.ts` lists only indexable public discovery routes and excludes `/admin`, `/student`, `/instructor`, `/dev`, `/api`, and auth routes.
- [x] `robots.ts` disallows private portals, dev pages, API routes, and auth routes.
- [x] Validated JSON-LD structured data:
  - `Organization` and `WebSite` on `/`
  - `BreadcrumbList` on `/courses/[slug]` and `/certifications/[slug]`
  - No fabricated `Review`, `AggregateRating`, or `Offer` pricing schema.
- [x] Invalid course/certification slugs invoke `notFound()` and render `src/app/not-found.tsx`.

---

## 2. Post-Launch Verification Tasks (Phases 9–10)

The following require live production deployment and cannot be completed locally during Phase 3:

- [ ] Verify domain ownership in Google Search Console for `https://www.mystackvarsity.com`.
- [ ] Submit `https://www.mystackvarsity.com/sitemap.xml` in Search Console and inspect live indexing coverage.
- [ ] Validate rendered Open Graph cards and Core Web Vitals against the deployed production URL.
