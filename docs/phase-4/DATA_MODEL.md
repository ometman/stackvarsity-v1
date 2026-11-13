# Phase 4 — LMS Data Model Specification

## 1. Enums

| Enum | Values | Purpose |
| --- | --- | --- |
| `CourseStatus` | `DRAFT`, `IN_REVIEW`, `APPROVED`, `PUBLISHED`, `ARCHIVED` | Finite course publication lifecycle |
| `CourseAccessType` | `FREE`, `PAID` | Distinguishes free/open courses from Phase 7 paid courses |
| `LessonType` | `TEXT`, `VIDEO`, `RESOURCE` | Supported Phase 4 lesson formats |
| `EnrollmentStatus` | `ACTIVE`, `COMPLETED`, `REVOKED` | Learner access lifecycle |
| `EnrollmentSource` | `FREE`, `ADMIN_GRANTED`, `PAID` | Tracks entitlement origin (`PAID` reserved for Phase 7) |

---

## 2. Core Entities & Constraints

| Model | Key Fields | Indexes & Uniqueness |
| --- | --- | --- |
| `Course` | `id`, `slug`, `title`, `summary`, `overview`, `category`, `level`, `status`, `accessType`, `intendedAudience` (`String[]`), `prerequisites` (`String[]`), `learningOutcomes` (`String[]`), `publishedAt`, `createdById` | `@unique` on `slug`; `@@index([status])`, `@@index([category])` |
| `InstructorAssignment` | `id`, `courseId`, `userId`, `assignedById`, `assignedAt` | `@@unique([courseId, userId])`; `@@index([userId])` |
| `CourseModule` | `id`, `courseId`, `title`, `description`, `position`, `archivedAt` | `@@index([courseId, position])` |
| `Lesson` | `id`, `moduleId`, `slug`, `title`, `type`, `content` (`Text`), `videoUrl`, `position`, `isPublished`, `archivedAt` | `@@unique([moduleId, slug])`; `@@index([moduleId, position])` |
| `LessonResource` | `id`, `lessonId`, `title`, `url`, `resourceType`, `position` | `@@index([lessonId, position])` |
| `Enrollment` | `id`, `userId`, `courseId`, `status`, `source`, `enrolledAt`, `completedAt`, `revokedAt` | `@@unique([userId, courseId])`; `@@index([userId, status])`, `@@index([courseId, status])` |
| `LessonProgress` | `id`, `userId`, `lessonId`, `courseId`, `completed`, `completedAt`, `lastViewedAt` | `@@unique([userId, lessonId])`; `@@index([userId, courseId])` |
| `CourseProgress` | `id`, `userId`, `courseId`, `completedLessons`, `totalLessons`, `progressPercent`, `lastLessonId`, `completedAt` | `@@unique([userId, courseId])`; `@@index([userId])` |

---

## 3. Integrity & Deletion Policy

- **Safe Archival:** Courses with active enrollments should be transitioned to `ARCHIVED` rather than hard-deleted, preserving historical `Enrollment` and `LessonProgress` records.
- **Deterministic Progress:** `CourseProgress.progressPercent` is always computed server-side inside a Prisma transaction from `completedLessons / totalEligiblePublishedLessons * 100` (clamped `0..100`, `0` when `totalLessons === 0`).
- **Opt-In Development Seed:** `prisma/seed.ts` provides idempotent sample free courses (`upsert` by `slug`) for local development only; never auto-seeded in production.
