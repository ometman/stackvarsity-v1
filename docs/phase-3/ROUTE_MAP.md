# Phase 3 — Route Map & Architecture Inventory

**Project:** Stack Varsity V1  
**Phase:** 3 — Public Website & Discovery Experience  
**Branch:** `feature/001-phase-3-public-website`  
**Status:** Baseline frozen for Steps 3.2–3.12

---

## 1. Existing Routes (Phase 1 & Phase 2 Baseline)

| Path                                                   | File                                                        | Group / Type      | Status                                                                                                       |
| ------------------------------------------------------ | ----------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `/`                                                    | `src/app/page.tsx`                                          | Root starter page | **Migrate** to `src/app/(marketing)/page.tsx` in Step 3.3 (delete `src/app/page.tsx` to avoid duplicate `/`) |
| `/login`                                               | `src/app/(auth)/login/page.tsx`                             | `(auth)`          | Live (Phase 2)                                                                                               |
| `/register`                                            | `src/app/(auth)/register/page.tsx`                          | `(auth)`          | Live (Phase 2)                                                                                               |
| `/forgot-password`                                     | `src/app/(auth)/forgot-password/page.tsx`                   | `(auth)`          | Live (Phase 2)                                                                                               |
| `/reset-password`                                      | `src/app/(auth)/reset-password/page.tsx`                    | `(auth)`          | Live (Phase 2)                                                                                               |
| `/verify-email`                                        | `src/app/(auth)/verify-email/page.tsx`                      | `(auth)`          | Live (Phase 2)                                                                                               |
| `/student`                                             | `src/app/(student)/student/page.tsx`                        | `(student)`       | Protected (Phase 2)                                                                                          |
| `/instructor`                                          | `src/app/(instructor)/instructor/page.tsx`                  | `(instructor)`    | Protected (Phase 2)                                                                                          |
| `/admin`                                               | `src/app/(admin)/admin/page.tsx`                            | `(admin)`         | Protected (Phase 2)                                                                                          |
| `/admin/mfa`                                           | `src/app/(admin)/admin/mfa/page.tsx`                        | `(admin)`         | Protected (Phase 2)                                                                                          |
| `/dev/ui`                                              | `src/app/dev/ui/page.tsx`                                   | Dev showcase      | Non-public / exclude from sitemap & robots                                                                   |
| `/api/health`, `/api/ready`                            | `src/app/api/health/route.ts`, `src/app/api/ready/route.ts` | API               | Live (Phase 1)                                                                                               |
| `/api/auth/*`                                          | `src/app/api/auth/*`                                        | API               | Live (Phase 2)                                                                                               |
| `/api/admin/*`, `/api/instructor/*`, `/api/students/*` | `src/app/api/*`                                             | API               | Protected (Phase 2)                                                                                          |

---

## 2. Planned Phase 3 Public Routes

All public marketing and discovery pages live under `src/app/(marketing)/` so URL paths remain clean without duplicating `/`.

| Path                     | Target File                                          | Purpose                                                                                                        | Rendering                                           | Step      |
| ------------------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | --------- |
| `/`                      | `src/app/(marketing)/page.tsx`                       | Homepage: value proposition, pillars, how it works preview, featured preview tracks, FAQ preview, primary CTAs | Static / Server Component                           | 3.3       |
| `/courses`               | `src/app/(marketing)/courses/page.tsx`               | Public course catalog with search, category/level filters, empty states                                        | Server + Client filter controls                     | 3.4       |
| `/courses/[slug]`        | `src/app/(marketing)/courses/[slug]/page.tsx`        | Course detail page, outcomes, audience, prerequisites, CTA handoff, 404 for unknown slugs                      | Server Component (`generateMetadata`, `notFound()`) | 3.5       |
| `/certifications`        | `src/app/(marketing)/certifications/page.tsx`        | Certification preparation directory with explicit third-party issuer attribution                               | Server Component                                    | 3.6       |
| `/certifications/[slug]` | `src/app/(marketing)/certifications/[slug]/page.tsx` | Certification track detail, exam-body disclaimer, prerequisites, readiness CTA, 404 for unknown slugs          | Server Component (`generateMetadata`, `notFound()`) | 3.6       |
| `/about`                 | `src/app/(marketing)/about/page.tsx`                 | Mission, values, educational approach, verified company facts                                                  | Static / Server Component                           | 3.7       |
| `/how-it-works`          | `src/app/(marketing)/how-it-works/page.tsx`          | Discover → Learn → Practice → Prepare journey (distinguishing live vs planned LMS/exam features)               | Static / Server Component                           | 3.7       |
| `/faq`                   | `src/app/(marketing)/faq/page.tsx`                   | Categorized, evidence-based FAQ with keyboard-accessible disclosure controls                                   | Server + Client disclosure                          | 3.7       |
| `/contact`               | `src/app/(marketing)/contact/page.tsx`               | Verified email (`hello@mystackvarsity.com`), alternate contact guidance, validated inquiry workflow            | Server + Client form                                | 3.8       |
| `/privacy`               | `src/app/(marketing)/privacy/page.tsx`               | Privacy policy surface (clearly marked draft/pending legal approval until approved copy is supplied)           | Static / Server Component                           | 3.8       |
| `/terms`                 | `src/app/(marketing)/terms/page.tsx`                 | Terms of use surface (clearly marked draft/pending legal approval until approved copy is supplied)             | Static / Server Component                           | 3.8       |
| `/sitemap.xml`           | `src/app/sitemap.ts`                                 | Public indexable routes only (excludes `/admin`, `/student`, `/instructor`, `/dev`, `/api`, auth callbacks)    | MetadataRoute.Sitemap                               | 3.9       |
| `/robots.txt`            | `src/app/robots.ts`                                  | Allow public discovery routes; disallow private, auth, and dev paths                                           | MetadataRoute.Robots                                | 3.9       |
| Not Found                | `src/app/not-found.tsx`                              | Branded, accessible 404 page with navigation back to `/`, `/courses`, `/certifications`                        | Server Component                                    | 3.5 / 3.9 |

---

## 3. Route Collision & Layout Strategy

1. **No Duplicate `/`:** `src/app/page.tsx` will be removed when `src/app/(marketing)/page.tsx` is created in Step 3.3. `tests/unit/home-page.test.tsx` will be updated to import from `@/app/(marketing)/page` and assert the new Stack Varsity homepage.
2. **Header & Footer Separation:**
   - `src/app/layout.tsx` continues to render `<Suspense><SiteHeader /></Suspense>` so all route groups (`(marketing)`, `(auth)`, `(student)`, `(instructor)`, `(admin)`) share consistent top-level navigation and auth state.
   - `SiteHeader` will be enhanced with responsive public navigation links (`Courses`, `Certifications`, `How It Works`, `About`, `Contact`) plus a keyboard-accessible mobile menu, while preserving existing Phase 2 auth links (`/login`, `/register`, `Dashboard`, `LogoutButton`).
   - `src/app/(marketing)/layout.tsx` wraps marketing pages with a semantic `<main id="main-content">` container and `<SiteFooter />`.
   - A skip-to-content link (`#main-content`) will be included in `src/app/layout.tsx` (or `SiteHeader`) so keyboard users can bypass navigation on all pages.
3. **Next.js 16 `cacheComponents` & `partialPrefetching`:**
   - `next.config.ts` enables `cacheComponents: true` and `partialPrefetching: true`.
   - Any Server Component reading `searchParams`, `cookies()`, `headers()`, or `getCurrentUser()` must be wrapped in `<Suspense>` to avoid prerender/build errors.
