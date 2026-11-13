# Phase 4 — Implementation Notes & Baseline Audit

**Project:** Stack Varsity V1  
**Branch:** `feature/002-phase-4-lms-core` (branched from `origin/development` at `5c26f64`)  
**Phase:** 4 — LMS Core (Courses, Authoring, Enrollment & Learning Progress)

---

## 1. Entry Baseline & Reconciliation

### Repository State Verified

- **Framework & Runtime:** Next.js `16.4.6` (`cacheComponents: true`, `partialPrefetching: true`), React `19.3.0`, TypeScript `5.x`, Prisma `7.10.1` (`@prisma/adapter-pg`), Auth.js `next-auth@5.0.0-beta.32`, Vitest `5.1.0`, Playwright `1.59.1`.
- **Phase 2 Foundation:** `User`, `Session`, `SecurityAuditEvent`, `AdminMfaFactor`, `requireAuth()`, `requireRole()`, `requirePermission()`, `requireResourceAccess()`, `requirePageRole()`, `PERMISSIONS` (`STUDENT_COURSES_READ`, `INSTRUCTOR_COURSES_MANAGE_ASSIGNED`, etc.).
- **Phase 3 Foundation:** `(marketing)` public pages, `/courses`, `/courses/[slug]`, `CourseCatalogRepository` interface in `src/modules/catalog/repositories/course-repository.ts`, `sitemap.ts`.
- **Existing Empty Module Directories:** `src/modules/courses/`, `src/modules/enrollments/`, `src/modules/learning/`.
- **Existing Protected Stubs:** `/student` (`src/app/(student)/student/page.tsx`), `/instructor` (`src/app/(instructor)/instructor/page.tsx`), `GET /api/instructor/courses` (`src/app/api/instructor/courses/route.ts`).

### Plan Reconciliation (`PHASE_4_DEVELOPMENT_PLAN I.md` & `II.md`)

1. **Course & Lesson Structure:** `Course` → `CourseModule` (section) → `Lesson` → `LessonResource`, plus `InstructorAssignment`, `Enrollment`, `LessonProgress`, `CourseProgress`.
2. **Public Catalog Migration:** Replace `ProvisionalCourseCatalogRepository` on `/courses`, `/courses/[slug]`, and `sitemap.ts` with `PrismaCourseCatalogRepository` returning only `PUBLISHED` courses from PostgreSQL (with graceful empty-state handling when no published courses exist yet).
3. **Access & Payment Boundary:** Phase 4 supports `FREE` and `ADMIN_GRANTED` enrollments only. `PAID` courses remain locked and cannot be self-enrolled until Phase 7 Paystack checkout & entitlements are implemented.
4. **Next.js 16 `cacheComponents`:** All Server Components reading session, `cookies()`, `headers()`, `params`, or dynamic DB data must wrap dynamic subtrees in `<Suspense>` boundaries and avoid `new Date()` in static prerendered paths.
