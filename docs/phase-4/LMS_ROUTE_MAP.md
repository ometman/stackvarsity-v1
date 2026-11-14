# Phase 4 — LMS Route & API Map

## 1. Public Routes (Updated in Phase 4)

| Route | Purpose | Data Source & Visibility |
| --- | --- | --- |
| `/courses` | Public course catalog with search, category, and level filters | `PrismaCourseCatalogRepository` (`CourseStatus.PUBLISHED` only) |
| `/courses/[slug]` | Public course detail, syllabus preview, and enrollment CTA | `PrismaCourseCatalogRepository` (`PUBLISHED` only; 404 otherwise) |
| `/sitemap.xml` | Dynamic sitemap including published course slugs | `listPublicCourseSlugs()` (`PUBLISHED` only) |

## 2. Protected Learner Routes (`noindex`)

| Route | Purpose | Access Control |
| --- | --- | --- |
| `/student` | Learner dashboard: active/completed enrollments, progress bars, resume CTA | `STUDENT` or `ADMIN` (`requirePageRole`) |
| `/learn/[courseSlug]` | Course workspace entry: redirects to `lastLessonId` or first eligible lesson | Active `Enrollment` or assigned `INSTRUCTOR` / `ADMIN` preview |
| `/learn/[courseSlug]/[lessonSlug]` | Protected lesson player, curriculum sidebar, resources, completion toggle, prev/next nav | Active `Enrollment` or assigned `INSTRUCTOR` / `ADMIN` preview |

## 3. Protected Instructor & Admin Routes (`noindex`)

| Route | Purpose | Access Control |
| --- | --- | --- |
| `/instructor` | Assigned courses list, status badges, create course form | `INSTRUCTOR` or `ADMIN` (`requirePageRole`) |
| `/instructor/courses/[courseId]` | Course metadata editor, module/lesson builder, reorder, lifecycle transitions, draft preview | Assigned `INSTRUCTOR` or MFA-verified `ADMIN` |
| `/admin/courses` | Admin course governance, instructor assignment, and enrollment grant/revoke | MFA-verified `ADMIN` (`requirePageRole(["ADMIN"])`) |

## 4. API Endpoints

| Endpoint | Method | Purpose | Auth & Guard |
| --- | --- | --- | --- |
| `/api/instructor/courses` | `GET`, `POST` | List assigned courses / create draft course | `INSTRUCTOR` (assigned) or `ADMIN` |
| `/api/instructor/courses/[courseId]` | `GET`, `PATCH` | Read / update course metadata | Assigned `INSTRUCTOR` or `ADMIN` |
| `/api/instructor/courses/[courseId]/publish` | `POST` | Transition lifecycle (`IN_REVIEW`, `APPROVED`, `PUBLISHED`, `ARCHIVED`, `DRAFT`) | Assigned `INSTRUCTOR` or `ADMIN` |
| `/api/instructor/courses/[courseId]/modules` | `POST`, `PATCH` | Create / update / reorder / archive modules | Assigned `INSTRUCTOR` or `ADMIN` |
| `/api/instructor/modules/[moduleId]/lessons` | `POST`, `PATCH` | Create / update / reorder / archive lessons & resources | Assigned `INSTRUCTOR` or `ADMIN` |
| `/api/admin/courses/[courseId]/assignments` | `POST`, `DELETE` | Assign / remove instructor on course (audited) | MFA-verified `ADMIN` |
| `/api/admin/enrollments` | `POST`, `PATCH` | Grant (`ADMIN_GRANTED`) or revoke enrollment (audited) | MFA-verified `ADMIN` |
| `/api/enrollments` | `POST` | Idempotent self-enrollment in `PUBLISHED` `FREE` course | Authenticated `ACTIVE` user |
| `/api/me/enrollments` | `GET` | List current user's enrollments and `CourseProgress` | Authenticated `ACTIVE` user (`session.user.id`) |
| `/api/learning/progress` | `POST` | Transactional lesson completion toggle & `CourseProgress` recalculation | Authenticated `ACTIVE` user with active `Enrollment` |
