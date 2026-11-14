# Phase 4 — LMS Authorization Matrix

## 1. Role & Resource Scope Matrix

| Operation | Visitor | Student (Unenrolled) | Student (Enrolled Active) | Instructor (Assigned) | Instructor (Unassigned) | Admin (MFA Verified) |
| --- | --- | --- | --- | --- | --- | --- |
| View `PUBLISHED` course summary (`/courses`, `/courses/[slug]`) | Allow | Allow | Allow | Allow | Allow | Allow |
| View `DRAFT` / `IN_REVIEW` / `ARCHIVED` course | Deny (404) | Deny (404) | Deny (404) | Allow (preview) | Deny (403) | Allow (preview) |
| Create course | Deny (401) | Deny (403) | Deny (403) | Allow (auto-assigned) | Allow (auto-assigned) | Allow |
| Edit course / modules / lessons | Deny (401) | Deny (403) | Deny (403) | Allow | Deny (403) | Allow |
| Submit course for review (`DRAFT` → `IN_REVIEW`) | Deny | Deny | Deny | Allow | Deny (403) | Allow |
| Publish / Archive course | Deny | Deny | Deny | Allow (assigned) | Deny (403) | Allow |
| Assign / remove instructor on course | Deny | Deny | Deny | Deny (403) | Deny (403) | Allow (audited) |
| Self-enroll in `PUBLISHED` `FREE` course | Deny (401) | Allow | Idempotent Allow | Allow | Allow | Allow |
| Self-enroll in `PAID` or `DRAFT` course | Deny | Deny (403) | Deny (403) | Deny (403) | Deny (403) | Deny (Phase 7) |
| Read `/learn/[courseSlug]/[lessonSlug]` | Deny (redirect) | Deny (403) | Allow | Allow (preview) | Deny (403) | Allow (preview) |
| Mark lesson complete (`POST /api/learning/progress`) | Deny (401) | Deny (403) | Allow (own) | Deny unless enrolled | Deny | Deny unless enrolled |
| Read/modify another student's enrollment or progress | Deny | Deny | Deny (403) | Deny (403) | Deny (403) | Audited read only |

---

## 2. Enforcement Rules

1. Every API route and Server Action verifies session + `User.status === "ACTIVE"` via `requireAuth()` / `requireRole()` / `requirePermission()`.
2. Course authoring operations verify `InstructorAssignment` for `INSTRUCTOR` actors (`ADMIN` bypasses assignment restriction after MFA check).
3. Learner progress and enrollment reads/writes always scope queries by `session.user.id`—never trusting a client-supplied `userId`, `enrollmentId`, or `progressPercent`.
