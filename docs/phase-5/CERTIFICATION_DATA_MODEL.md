# Phase 5 — Certification Data Model & Migration Safety

**Phase:** 5 — Professional Certification Preparation  
**Migration:** `add_certification_catalogue_models` (additive, non-destructive)

---

## 1. Entity Relationship Overview

```text
CertificationProvider (1) ──< (N) Certification (1) ──< (N) ExamVersion
ExamVersion (1) ──< (N) ExamDomain (1) ──< (N) ExamObjective (self-parent hierarchy)
ExamVersion (1) ──< (N) PreparationTrack
PreparationTrack (1) ──< (N) TrackAssignment >── (1) User (AUTHOR / REVIEWER)
PreparationTrack (1) ──< (N) ObjectiveResourceMapping >── (0..1) Course / (0..1) Lesson
PreparationTrack (1) ──< (N) LearnerPreparationEnrollment >── (1) User
```

---

## 2. Enums

| Enum | Values | Purpose |
|---|---|---|
| `CertificationLifecycleStatus` | `DRAFT`, `IN_REVIEW`, `PUBLISHED`, `RETIRED` | Finite publication lifecycle for exam versions and preparation tracks |
| `SourceVerificationStatus` | `VERIFIED`, `NEEDS_REVERIFICATION`, `UNVERIFIED` | Tracks whether external exam-blueprint metadata has been verified |
| `TrackAccessType` | `FREE`, `PAID` | Descriptive tier only (paid checkout deferred to Phase 7) |
| `TrackAssignmentRole` | `AUTHOR`, `REVIEWER` | Scoped editorial permissions per preparation track |
| `TrackEnrollmentStatus` | `ACTIVE`, `COMPLETED`, `PAUSED`, `ARCHIVED` | Learner's participation state in a preparation track |

---

## 3. Models & Integrity Rules

| Model | Uniqueness & Indexes | Delete / Archive Policy |
|---|---|---|
| `CertificationProvider` | `@unique(slug)`, `@@index([isActive])` | `Restrict` from `Certification` |
| `Certification` | `@unique(slug)`, `@@index([providerId])`, `@@index([isActive])` | `Restrict` from `ExamVersion` |
| `ExamVersion` | `@@unique([certificationId, examCode, versionLabel])`, `@@index([certificationId, status])` | `Restrict` from `PreparationTrack`; never overwrite historical versions |
| `ExamDomain` | `@@unique([examVersionId, domainKey])`, `@@index([examVersionId, position])` | `Cascade` with `ExamVersion` |
| `ExamObjective` | `@@unique([examVersionId, objectiveKey])`, `@@index([domainId, position])`, `@@index([parentId])` | `Cascade` with `ExamVersion`/`ExamDomain`; `SetNull` on `parent` |
| `PreparationTrack` | `@unique(slug)`, `@@index([status, archivedAt])`, `@@index([examVersionId])`, `@@index([createdById])` | `Restrict` from `LearnerPreparationEnrollment` & `ExamVersion`; supports `archivedAt` + `retiredAt` + optimistic `revision` |
| `TrackAssignment` | `@@unique([trackId, userId, role])`, `@@index([userId])` | `Cascade` with `PreparationTrack`/`User` |
| `ObjectiveResourceMapping` | `@@index([trackId, objectiveId, position])`, `@@index([courseId])`, `@@index([lessonId])` | `Cascade` with `PreparationTrack`/`ExamObjective`; `SetNull` on `Course`/`Lesson` with `isStale` flag |
| `LearnerPreparationEnrollment` | `@@unique([userId, trackId])`, `@@index([userId, status])`, `@@index([trackId])` | `Restrict` on `PreparationTrack` so learner history is preserved |

---

## 4. Migration Safety & Rollback

- **Additive Only:** All Phase 5 tables and foreign keys are purely additive; zero existing Phase 1–4 columns or rows are altered or dropped.
- **Public Read Contract:** Public catalog queries filter strictly on `status = PUBLISHED`, `archivedAt IS NULL`, and active `Certification` / `CertificationProvider`. Drafts and retired editions never leak to `/certifications`, `/certifications/[slug]`, or `/sitemap.xml`.
- **Attribution & Provenance:** `ExamVersion` stores `sourceUrl`, `verifiedAt`, `verificationStatus`, and `sourceNotes`. `PreparationTrack` stores an explicit `disclaimer` affirming independent preparation status.
