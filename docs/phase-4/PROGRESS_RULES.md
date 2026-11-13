# Phase 4 — Learning Progress & Resume Rules

## 1. Server-Authoritative Calculation

- Clients submit only `{ lessonId, completed }`; `userId` is always derived from the verified server session.
- `progressPercent = totalLessons > 0 ? Math.min(100, Math.max(0, Math.round((completedLessons / totalLessons) * 100))) : 0`.
- **Denominator:** Only non-archived, published (`isPublished: true`, `archivedAt: null`) lessons belonging to non-archived modules of the course are counted.

## 2. Course Completion & Unmark Rollback

- When `completedLessons >= totalLessons` (and `totalLessons > 0`), `CourseProgress.completedAt` is set and `Enrollment.status` transitions to `COMPLETED`.
- If a learner unmarks a lesson (`completed: false`), `CourseProgress.completedAt` is cleared and `Enrollment.status` reverts cleanly to `ACTIVE`.
- If an instructor later adds new published lessons to a course, `progressPercent` recalculates dynamically against the updated denominator on the next progress update.

## 3. Resume Pointer

- Opening any lesson as an enrolled learner updates `LessonProgress.lastViewedAt` and `CourseProgress.lastLessonId`.
- Visiting `/learn/[courseSlug]` redirects to `lastLessonId` if still eligible, or falls back to the first eligible lesson.
