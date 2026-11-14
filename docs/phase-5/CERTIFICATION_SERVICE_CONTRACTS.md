# Phase 5 — Certification Service Contracts & RBAC

## 1. Module Boundaries

- `src/modules/certification/schemas/certification-schemas.ts` — Zod validation for providers, certifications, exam versions, domains, objectives, tracks, and lifecycle transitions. Enforces `http://` / `https://` URLs, weight bounds (`0..100`, `min <= max`), and lowercase kebab-case slugs.
- `src/modules/certification/permissions/track-permissions.ts` — Server-only authorization helpers (`requireTrackEditor`, `requireTrackReviewer`) reusing `requireRole` (with Admin MFA enforcement) and `TrackAssignment`.
- `src/modules/certification/services/track-authoring-service.ts` — Server-only CRUD for providers, certifications, exam versions, domains, objectives (with parent-child cycle detection), and tracks (with optimistic `revision` concurrency).
- `src/modules/certification/services/track-lifecycle-service.ts` — Enforces finite status transitions (`DRAFT → IN_REVIEW → PUBLISHED → RETIRED`), completeness checks, separation of duties (authors cannot self-publish), and `SecurityAuditEvent` logging.

---

## 2. Lifecycle State Machine

| From | To | Required Scope | Validation Gate |
|---|---|---|---|
| `DRAFT` | `IN_REVIEW` | Assigned `AUTHOR` or `ADMIN` | Optimistic `expectedRevision` match |
| `IN_REVIEW` | `DRAFT` | Assigned `REVIEWER` or `ADMIN` | Optimistic `expectedRevision` match |
| `IN_REVIEW` | `PUBLISHED` | Assigned `REVIEWER` (not creator) or `ADMIN` | Non-retired `ExamVersion`, >= 1 `ExamDomain`, >= 1 `ExamObjective`, non-empty `disclaimer` |
| `PUBLISHED` | `RETIRED` | Assigned `REVIEWER` or `ADMIN` | Sets `retiredAt` |
| `RETIRED` | `DRAFT` | Assigned `REVIEWER` or `ADMIN` | Clears `retiredAt` |
