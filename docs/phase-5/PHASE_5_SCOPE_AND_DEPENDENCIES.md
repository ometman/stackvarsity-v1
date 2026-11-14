# Phase 5 — Scope, Dependencies, and Entry Audit

**Branch:** `feature/003-phase-5-certification-preparation`  
**Base Commit:** `8d3b6f7` (`origin/development`, includes Phase 1–4)  
**Target PR Base:** `development` (manual review & merge by repository owner)  
**Date:** 2026-11-14

---

## 1. Entry Audit Summary

- **Git & Branching:** Branched `feature/003-phase-5-certification-preparation` from `origin/development` (`8d3b6f7`, Merge PR #9 `feature/002-phase-4-lms-core`). Next consecutive feature number after `001` (Phase 3) and `002` (Phase 4).
- **Phase 2 Identity & Security:** Verified `src/modules/auth/` (`getCurrentSession`, `requireAuth`, `requireRole`, `requirePermission`, `requireResourceAccess`, `requirePageRole`, `recordAuditEvent`). Admin MFA is enforced on `ADMIN` routes and privileged mutations.
- **Phase 3 Public Catalog:** Verified `/certifications` and `/certifications/[slug]` in `src/app/(marketing)/certifications/`, backed by `src/modules/certification/services/certification-service.ts` (`PROVISIONAL_TRACKS`), and `src/app/sitemap.ts` (`listCertificationSlugs()`).
- **Phase 4 LMS Core:** Verified Prisma models in `prisma/schema.prisma` (`Course`, `InstructorAssignment`, `CourseModule`, `Lesson`, `LessonResource`, `Enrollment`, `LessonProgress`, `CourseProgress`), `src/modules/courses/`, `src/modules/enrollments/`, and `src/modules/learning/`.
- **Tech Stack:** Next.js `16.4.6`, React `19.3.0`, Prisma `7.10.1` (`@prisma/adapter-pg`), PostgreSQL, NextAuth `5.0.0-beta.32`, Zod `4.6.7`, Tailwind CSS `4.3.3`, Vitest `5.1.0`, Playwright `1.59.1`.

---

## 2. Deviation Register (`MASTER_PLAN.md` vs `PHASE_5_DEVELOPMENT_PLAN.md`)

| Topic | `docs/MASTER_PLAN.md` | `docs/PHASE_5_DEVELOPMENT_PLAN.md` | Resolution for Phase 5 |
|---|---|---|---|
| Timed mock exams & scoring | Listed in V1 launch scope | Explicitly deferred to Phase 6 | Implement **formative practice / knowledge checks** only (untimed, no pass/fail claims, no exam engine) |
| Payments & paid entitlements | Commercial platform | Deferred to Phase 7 | Tracks carry descriptive `accessType` (`FREE` / `PAID`), but paid courses/tracks remain gated until Phase 7 |
| Module folder name | `src/modules/certifications/` | Phase 3 created `src/modules/certification/` | Keep `src/modules/certification/` as the canonical module (avoiding duplicate module directories) and add Phase 5 sub-services/repositories/components cleanly inside it |
| Certification sub-routes | `/certifications`, `/certifications/[slug]` | Also lists `/objectives`, `/study-guide` | Integrate into existing `/certifications` and `/certifications/[slug]` and add `/certifications/[slug]/objectives` & `/certifications/[slug]/study-guide` as SEO-safe public views |

---

## 3. Cross-Phase Dependency Contracts

1. **Phase 2 Auth & RBAC (`src/modules/auth/`):**
   - Page guards: `requirePageRole(["STUDENT", "ADMIN"], path)` for `/student/certifications*`, `requirePageRole(["INSTRUCTOR", "ADMIN"], path)` for `/instructor/certifications*`, `requirePageRole(["ADMIN"], path)` for `/admin/certifications*`.
   - Service/API guards: `requireRole`, `requireAuth`, `recordAuditEvent` (`SecurityAuditEvent`).
   - No new global `UserRole` enum values; track authoring/reviewing uses explicit track-level assignment records (`TrackAssignment`) and `ADMIN` governance.
2. **Phase 3 Public Discovery (`src/app/(marketing)/certifications/`, `src/app/sitemap.ts`):**
   - Reuse existing routes and `certification-service.ts` exports (`listCertificationTracks`, `getCertificationTrackBySlug`, `listCertificationSlugs`), upgrading them from provisional arrays to PostgreSQL-backed queries (with safe fallback/empty handling).
   - Only `PUBLISHED` and non-archived tracks appear publicly, in `sitemap.xml`, or in `generateStaticParams`.
3. **Phase 4 LMS Core (`Course`, `CourseModule`, `Lesson`, `Enrollment`, `LessonProgress`):**
   - Objective mappings reference `Course.id` / `Lesson.id` via foreign keys.
   - Selecting or enrolling in a certification preparation track **never** bypasses `Enrollment` or `CourseAccessType.PAID` gates on mapped courses/lessons.
   - Objective coverage reads `LessonProgress` (`completed = true`) for mapped eligible (`PUBLISHED`, non-archived) lessons.

---

## 4. Attribution, Licensing & Content Integrity

- All public and learner-facing certification pages display an explicit **independent training provider** disclaimer.
- Exam codes, versions, and objective outlines include `sourceUrl`, `verifiedAt`, and `verificationStatus` metadata.
- All formative practice questions are **original Stack Varsity-authored items** with explicit provenance (`ORIGINAL_AUTHORED`) and licensing/review status. No vendor exam dumps, scraped questions, or unverified pass-score/price claims are included.

---

## 5. Deferred Features (Out of Scope for Phase 5)

- Timed mock examinations, proctoring, exam attempt limits, formal score reports, pass/fail certificates (**Phase 6**).
- Checkout, Paystack webhooks, paid subscriptions, refunds (**Phase 7**).
- Organization-wide BI dashboards and moderation queues (**Phase 8**).

---

## 6. Baseline Verification (Pre-Phase 5)

| Check | Command | Outcome | Notes |
|---|---|---|---|
| Typecheck | `npm run typecheck` | PASS | Zero errors |
| Lint | `npm run lint` | PASS | Zero errors |
| Prisma Validate | `npm run db:validate` | PASS | Schema valid |
| Migration Status | `npm run db:migrate:status` | PASS | 3 migrations applied; DB up to date |
| Unit & Integration Tests | `npm test` | PASS | 32 test files, 109 tests passed |
