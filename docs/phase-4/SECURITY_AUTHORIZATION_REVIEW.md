# Phase 4 — Security & Authorization Review

## 1. Authentication & Role Enforcement

- Every protected page (`/student`, `/instructor`, `/instructor/courses/[courseId]`, `/learn/[courseSlug]`, `/learn/[courseSlug]/[lessonSlug]`) enforces `requirePageRole()` inside a `<Suspense>` boundary, redirecting unauthenticated users to `/login` and checking `User.status === "ACTIVE"`.
- Every protected API route enforces `requireAuth()`, `requirePermission()`, or `requireRole(["ADMIN"], { requireAdminMfa: true })` and returns `Cache-Control: private, no-store`.

## 2. IDOR / BOLA & Scope Defenses

- **Course authoring:** `requireCourseEditorAccess(courseId, session)` verifies `InstructorAssignment` for `INSTRUCTOR` actors (or `ADMIN` with MFA). Unassigned instructors receive `403 Forbidden` and emit a `COURSE_ACCESS_DENIED` `SecurityAuditEvent`.
- **Enrollment:** `enrollInFreeCourse` and `listUserEnrollments` always derive `userId` from the verified server session (`session.user.id`), never trusting client-supplied user IDs. Paid courses (`accessType === "PAID"`) are rejected with `403 PAID_COURSE_LOCKED`.
- **Lesson player & progress:** `requireCourseEntitlement` and `setLessonCompletion` verify active `Enrollment` (or assigned staff preview for reads only) and verify the target lesson belongs to the enrolled course.

## 3. Content & Cache Isolation

- Lesson content is rendered via `SafeLessonContent` into React nodes without `dangerouslySetInnerHTML`.
- External resource and video URLs are validated with `safeHttpUrlSchema` (`http://` / `https://` only).
- Private LMS routes declare `robots: { index: false, follow: false }` and `/learn` is disallowed in `robots.ts`.
- Public catalog queries (`PrismaCourseCatalogRepository`) filter strictly on `status: "PUBLISHED"` and `archivedAt: null`.
