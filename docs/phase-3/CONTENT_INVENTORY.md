# Phase 3 — Content Inventory & Truthfulness Policy

**Project:** Stack Varsity V1  
**Domain:** `https://www.mystackvarsity.com`  
**Contact:** `hello@mystackvarsity.com`  
**Tagline:** Build • Educate • Innovate

---

## 1. Verified Brand & Business Facts

| Item                  | Verified Value                                                                                                                                                                     | Source                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Business Name         | Stack Varsity                                                                                                                                                                      | `src/config/site.ts`, `docs/MASTER_PLAN.md`                     |
| Tagline               | Build • Educate • Innovate                                                                                                                                                         | `src/config/site.ts`, `docs/MASTER_PLAN.md`                     |
| Canonical Domain      | `https://www.mystackvarsity.com`                                                                                                                                                   | `src/config/site.ts`, `src/app/layout.tsx`                      |
| Contact Email         | `hello@mystackvarsity.com`                                                                                                                                                         | `src/config/site.ts`, `docs/MASTER_PLAN.md`                     |
| Educational Pillars   | 1. Digital Skills Education (AI literacy, cloud fundamentals, Linux, networking, cybersecurity, web development, data analytics)<br>2. Professional Certification Exam Preparation | `docs/MASTER_PLAN.md` §1                                        |
| Target Audience       | Beginners, career changers, university/college students, upskilling professionals, and certification candidates in Ghana and beyond                                                | `docs/MASTER_PLAN.md` §1, `docs/PHASE_3_DEVELOPMENT_PLAN.md` §3 |
| Authentication Routes | `/register`, `/login`, `/forgot-password`, `/reset-password`, `/verify-email`                                                                                                      | Phase 2 implementation                                          |

---

## 2. Missing / Unapproved Assets & Provisional Data Policy

| Category                                  | Current Repository State                                                                    | Phase 3 Policy                                                                                                                                                                                                                                  | Release Blocker?                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Official Logo & Brand Colors**          | No SVG logo or brand color palette in `public/images/` or `src/app/globals.css`             | Retain typographic `"Stack Varsity"` wordmark and accessible neutral grayscale tokens (`docs/architecture/DESIGN_SYSTEM.md`).                                                                                                                   | Non-blocking for Phase 3 build; required before brand launch.                       |
| **Course Catalog Records**                | No Prisma `Course` model or seed data exists yet (Phase 4 scope)                            | Use strongly typed provisional preview dataset (`src/modules/catalog/`) labeled **Preview / Upcoming**. Do not invent fees, instructors, ratings, or active enrollment/checkout.                                                                | Non-blocking for Phase 3; replaced in Phase 4.                                      |
| **Certification Tracks**                  | No Prisma `Certification` / `Exam` models exist yet (Phase 5–6 scope)                       | Use strongly typed provisional preview tracks (`src/modules/certification/`) with explicit third-party issuer attribution and clear disclaimer that Stack Varsity provides independent exam preparation, not official vendor certification.     | Non-blocking for Phase 3; replaced in Phase 5–6.                                    |
| **Legal Policies (`/privacy`, `/terms`)** | No approved legal copy in repo                                                              | Publish clearly labeled **Draft — Pending Legal Review** pages explaining current platform status and avoiding fabricated legal claims.                                                                                                         | **Release blocker** for live production PII collection; tracked in Step 3.8 & 3.12. |
| **Contact Email Delivery**                | `src/server/mail.ts` supports Resend (`EMAIL_PROVIDER_API_KEY`) or `local-capture` fallback | Provide `hello@mystackvarsity.com` (`mailto:`) and a validated contact endpoint using `sendTransactionalEmail` with explicit server-side status (never falsely claiming external delivery when `local-capture` is active without provider key). | **Launch dependency** for production email delivery.                                |
| **Social Media Links**                    | No verified social handles                                                                  | Omit unverified social links from footer and metadata.                                                                                                                                                                                          | Non-blocking.                                                                       |
| **Testimonials / Stats / Pass Rates**     | None supplied                                                                               | Strictly prohibited from fabrication.                                                                                                                                                                                                           | N/A                                                                                 |

---

## 3. Page Content & Metadata Specification

| Route                    | H1 / Primary Objective                                           | Primary CTA                                                                          | Metadata & Schema                                                         |
| ------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `/`                      | Introduce Stack Varsity's digital skills & exam-prep platform    | `Explore Courses` (`/courses`), `Create Account` (`/register`)                       | Static `Metadata`, `Organization` & `WebSite` JSON-LD                     |
| `/courses`               | Search & filter provisional course catalog                       | `View Course` (`/courses/[slug]`)                                                    | Static `Metadata` + canonical `/courses`                                  |
| `/courses/[slug]`        | Present course overview, outcomes, audience, prerequisites       | `Register for Updates` (`/register`) or `Explore Certifications` (`/certifications`) | `generateMetadata` + canonical + `BreadcrumbList`                         |
| `/certifications`        | Browse independent certification-prep tracks                     | `View Track` (`/certifications/[slug]`)                                              | Static `Metadata` + canonical `/certifications`                           |
| `/certifications/[slug]` | Track details, exam-body disclaimer, prerequisites               | `Create Free Account` (`/register`)                                                  | `generateMetadata` + canonical + `BreadcrumbList`                         |
| `/about`                 | Explain mission, values, and teaching philosophy                 | `Explore Courses` (`/courses`)                                                       | Static `Metadata`                                                         |
| `/how-it-works`          | Explain Discover → Learn → Practice → Prepare (live vs upcoming) | `Create Account` (`/register`)                                                       | Static `Metadata`                                                         |
| `/faq`                   | Answer common learner & platform questions accurately            | `Contact Us` (`/contact`)                                                            | Static `Metadata`                                                         |
| `/contact`               | Provide `hello@mystackvarsity.com` & validated inquiry flow      | `Send Inquiry` / `Email Us`                                                          | Static `Metadata`                                                         |
| `/privacy`, `/terms`     | Display draft policy status & data-handling transparency         | `Contact Us` (`/contact`)                                                            | Static `Metadata` (`robots: { index: false }` or standard until approved) |
