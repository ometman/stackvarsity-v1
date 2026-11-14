# Phase 4 — Content & Publication Policy

## 1. Publication Lifecycle

Courses progress through the finite state machine:
`DRAFT` → `IN_REVIEW` → `APPROVED` → `PUBLISHED` → `ARCHIVED`

- Only `PUBLISHED` (non-archived) courses appear on `/courses`, `/courses/[slug]`, and `/sitemap.xml`.
- Publishing or approving a course requires: non-empty title, summary (≥10 chars), overview (≥10 chars), category, level, at least 1 active module, and at least 1 published lesson with content.
- `DRAFT`, `IN_REVIEW`, `APPROVED`, and `ARCHIVED` courses are strictly hidden from public catalog queries and return `404` on `/courses/[slug]`.

## 2. Rich Content & External Resource Safety

- Lesson bodies use structured plain/Markdown text rendered safely into React elements without raw `dangerouslySetInnerHTML`.
- External resource links and video URLs are validated server-side with `safeHttpUrlSchema` (`http://` and `https://` only; `javascript:` and `data:` schemes are rejected).
- Outbound resource links render with `target="_blank"` and `rel="noopener noreferrer"`.

## 3. Draft Preview & Cache Isolation

- Assigned instructors and MFA-verified administrators may preview draft courses at `/learn/[courseSlug]/[lessonSlug]` (`noindex`, `Cache-Control: private, no-store`).
- Unassigned instructors and non-enrolled students receive `403` / `404`.
