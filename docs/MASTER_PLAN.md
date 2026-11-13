# STACK VARSITY V1 — PRODUCTION-READY DEVELOPMENT MASTER PLAN

**Document version:** 1.0  
**Document date:** 12 November 2026  
**Project:** Stack Varsity — Digital Skills & Professional Certification Preparation Platform  
**Business:** Stack Varsity  
**Tagline:** Build • Educate • Innovate  
**New source repository:** <https://github.com/ometman/stackvarsity-v1.git>  
**Legacy reference repository:** <https://github.com/ometman/stackvarsity.git>  
**Canonical public domain:** <https://www.mystackvarsity.com>  
**Public contact email:** <hello@mystackvarsity.com>  
**Delivery approach:** Local-first development, release-ready production engineering  
**Status:** Proposed implementation blueprint; implementation and repository state require verification

> **Important distinction:** This document defines the **new Stack Varsity V1 repository and target architecture**. The legacy repository may be reviewed for reusable code, but it is **not** the V1 source of truth. No assumption is made that either repository has already been cloned, audited, or configured. Version numbers, vendor certifications, payment conditions, and regulatory requirements must be verified at implementation time.

---

## 1. Executive decision and vision

Stack Varsity V1 will be a commercial, mobile-first platform helping people **learn practical digital skills**, **prepare for professional IT certification exams**, **assess readiness**, and **track progress**. It targets self-paced learners, students, working professionals, career switchers, and, eventually, employers in Ghana and beyond.

The initial business has **two primary educational pillars**:

1. **Digital Skills Education:** AI literacy, cloud fundamentals, Linux, networking, cybersecurity, web development, data analytics, productivity, and carefully selected adjacent subjects.
2. **Professional Certification Exam Preparation:** Structured syllabi, exam-domain-aligned lessons, original/licensed practice questions, timed mock exams, explanations, remediation, and readiness reporting.

### 1.1 Success criteria

- A learner can discover a course, register, enroll or pay, learn, take assessments, review outcomes, and return to their progress without administrator intervention.
- An authorized content manager can create, review, version, publish, and retire courses and exam questions.
- A student can take a server-timed exam without seeing answer keys before authorized results release.
- Payment verification, enrollment entitlement, and refunds remain consistent and auditable.
- The site meets measurable accessibility, performance, resilience, privacy, and application-security standards.
- A new developer can clone the V1 repository, install dependencies, seed local test data, and run automated checks using documented commands.

### 1.2 Explicit scope boundaries

**V1 launch scope:** Public site, user accounts, role permissions, course catalog, content/lesson delivery, enrollment, learning progress, certifications directory, question bank, topic quizzes, timed mock exams, results and analytics, payment processing, transactional notifications, admin portal, policy pages, basic reporting, backup and operations.

**Post-launch scope:** AI tutor, online code execution, elaborate gamification, full public forum, native mobile apps, enterprise training portals, multi-tenancy, and instructor marketplace. These must not block V1 launch.

**Important branding:** Stack Varsity provides **training and exam preparation**, not official certificates issued by AWS, Microsoft, CompTIA, Cisco, etc. Its own course-completion credentials must be labeled distinctly. Vendor names and marks require appropriate attribution and no misleading affiliation claims.

---

## 2. Project governance, repository and migration

### 2.1 Repository policy

| Repository                | Purpose                         | Policy                                                                         |
| ------------------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| `ometman/stackvarsity-v1` | **Canonical V1 implementation** | All new V1 feature work, issues, pull requests, release tags and documentation |
| `ometman/stackvarsity`    | Legacy reference                | Audit/read and selectively port verified modules; do not merge wholesale       |

Use a clean V1 history. Maintain attribution and applicable licenses for any reused legacy or third-party code. Before importing old material, scan it for secrets, vulnerabilities, obsolete dependencies, unlicensed assets, and legacy business assumptions. Never copy production `.env`, database dumps, credentials, or personal information into Git.

### 2.2 Repository bootstrapping

```bash
# New canonical repository (clone only after it has been created and access is available)
git clone https://github.com/ometman/stackvarsity-v1.git
cd stackvarsity-v1

# Optional: add the prior project only as a reference remote
git remote add legacy https://github.com/ometman/stackvarsity.git
git fetch legacy

git switch -c development
```

If the new repo is empty, initialize it with `README.md`, `.gitignore`, `.editorconfig`, an appropriate `LICENSE` (subject to business/legal choice), the present plan under `docs/`, workspace configuration, CI pipeline, and an initial release tag only after baseline checks pass.

### 2.3 Required Phase 0 audit

Inventory the legacy repo and document:

- Folder layout, framework/library versions, lockfiles, licenses and Git history.
- Existing routes, components, backend endpoints and database tables.
- Working vs incomplete features; tests and build status.
- Auth/session model, authorization boundaries, token storage and password-handling implementation.
- Payment code, potential customer data and secrets; media and storage assumptions.
- Dependency, SAST, secret-scan and container-image findings.
- Copyright status of content and certification exam material.

Classify each module **Retain / Refactor / Replace / Retire / Build New**. Produce `docs/audits/legacy-audit.md`, `feature-inventory.csv`, `dependency-risk-register.md`, and an Architecture Decision Record (ADR) for each major migration decision.

### 2.4 Branching and review

- Protected `main`: releasable and tagged.
- Short-lived `feature/*`, `fix/*`, `security/*`, `docs/*` branches; `development` optional for integration.
- Pull requests must link to issues, list migrations and security effects, and pass CI.
- Require review when collaborators are available; solo maintainer documents checklist-based self-review.
- Conventional commits encouraged; version releases semantically; keep `CHANGELOG.md`.

---

## 3. Target technical architecture

### 3.1 Guiding decisions

- **Modular monolith**, not microservices: one API deployment, organized by bounded business domains.
- **Next.js + React + TypeScript** frontend; **Node.js + Express + TypeScript** backend; **PostgreSQL** system of record. These are target recommendations and must be validated against latest supported versions when pinned.
- **REST API** at `/api/v1`, described by OpenAPI; shared schema contracts.
- Server-side data access; frontend never connects directly to PostgreSQL.
- **Local-first** with Docker Compose or documented equivalent; production infrastructure is deployment-agnostic until approved.
- Choose **one** ORM/query layer (Prisma _or_ a suitably proven existing SQL layer) after audit; avoid parallel migration systems.
- Prefer secure, **HttpOnly, Secure, SameSite** browser sessions. If JWTs are necessary, rotate and revoke refresh credentials; do not store persistent sensitive tokens in `localStorage`.
- Separate long-running work (email, report preparation, document generation, notifications) into durable background jobs, initially backed by PostgreSQL if practical.

### 3.2 Logical diagram

```text
Browser / Mobile Browser
         |
         v
www.mystackvarsity.com  (HTTPS; Next.js + same-origin BFF)
         |
         v
Private Express API (/api/v1)
         |
  +------+------+---------+-----------+
  |      |      |         |           |
 Identity Learning Exams Commerce   Admin/Reports
  +------+------+---------+-----------+
         |
  PostgreSQL + private object/media storage
         |
  Background jobs / email / payment-provider webhooks
         |
  Structured logs / metrics / alerts / backup & recovery
```

### 3.3 Suggested repository layout

```text
stackvarsity-v1/
├── apps/
│   ├── web/
│   │   ├── src/app/                # public, auth, learner, instructor, admin routes
│   │   ├── src/components/         # shared design system and layouts
│   │   ├── src/features/           # courses, exams, checkout, profile...
│   │   ├── src/lib/                # API client, auth, utilities
│   │   ├── src/hooks/
│   │   ├── public/
│   │   └── tests/
│   └── api/
│       ├── src/modules/            # auth, users, courses, exams, commerce...
│       ├── src/middleware/
│       ├── src/config/
│       ├── src/database/
│       ├── src/jobs/
│       ├── src/app.ts
│       ├── src/server.ts
│       └── tests/
├── packages/
│   ├── api-contracts/
│   ├── validation/
│   ├── shared-types/
│   └── ts-config/
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── scripts/
├── infra/
│   ├── docker/
│   ├── reverse-proxy/
│   └── monitoring/
├── docs/
│   ├── architecture/
│   ├── audits/
│   ├── api/
│   ├── product/
│   ├── security/
│   ├── operations/
│   └── decisions/
├── .github/workflows/
├── .env.example
├── .editorconfig
├── .gitignore
├── docker-compose.yml
├── package.json
├── package-lock.json
├── README.md
├── CHANGELOG.md
└── LICENSE
```

Monorepo paths are the target. Legacy modules may remain temporarily in staging locations until successfully ported and tested. Do not perform high-risk one-shot reorganization.

---

## 4. Product design, UX and accessibility

### 4.1 Information architecture

Primary public navigation: **Home, Courses, Certifications, Learning Paths, Practice Exams, Pricing, About**, with **Sign In** and **Get Started** CTAs. Logged-in navigation: **Dashboard, My Learning, Certifications, Practice, Exam Results, Certificates, Billing, Settings**.

### 4.2 Design standards

- Preserve established Stack Varsity brand elements and approved colors; build design tokens for typography, spacing, colors, borders and states.
- Mobile-first, accessible component library (shadcn/ui where appropriate), consistent focus/hover/disabled/error patterns.
- WCAG 2.2 AA target, keyboard operation, semantic headings, clear focus states, alt text and captions/transcripts for educational media.
- Low-bandwidth optimizations: progressive loading, reasonable image sizes, no unprompted video autoplay, limited page JS and explicit download sizes.
- Avoid oversized dashboard pages: use actionable summary cards, tabs, filters and links to deeper views.
- Do not show fictional testimonials, fabricated pass rates, or unverified partnerships.

### 4.3 Public routes and functional acceptance

| Page / route                                           | Key content and functionality                                                                                          |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `/`                                                    | Hero, value proposition, program pillars, featured courses and certifications, how it works, trust signals, clear CTAs |
| `/courses`                                             | Search, category/difficulty/free-paid filters, pagination, course cards                                                |
| `/courses/[slug]`                                      | Objectives, syllabus, instructor, prerequisites, length, access terms, price, enrollment                               |
| `/certifications`                                      | Provider/topic directory, current exam-prep offerings, search and filters                                              |
| `/certifications/[slug]`                               | Exam version/date, domains, study path, mock exams, disclaimers, official source reference                             |
| `/learning-paths`                                      | Curated multi-course paths                                                                                             |
| `/learning-paths/[slug]`                               | Ordered curriculum, intended outcomes, enrollment                                                                      |
| `/practice-exams`                                      | Discover assessment packages, format, access requirements                                                              |
| `/pricing`                                             | Actual published plans, course purchases, refund terms, GHS pricing                                                    |
| `/about`                                               | Mission, team/company information, educational model                                                                   |
| `/contact`                                             | Form with abuse controls; show `hello@mystackvarsity.com`                                                              |
| `/faq`                                                 | Enrollment, payment, exam-prep and support questions                                                                   |
| `/privacy`                                             | Data processing, rights, retention, contact                                                                            |
| `/terms`                                               | Service and acceptable-use terms                                                                                       |
| `/refund-policy`                                       | Refund rules aligned with payment contracts and applicable law                                                         |
| `/accessibility`                                       | Accessibility commitments and issue reporting                                                                          |
| `/login`, `/register`                                  | Secure account access/creation                                                                                         |
| `/verify-email`, `/forgot-password`, `/reset-password` | Email validation and safe recovery                                                                                     |
| `/404`, `/error`, `/maintenance`                       | Useful fallback states                                                                                                 |

**SEO:** canonical URLs under `https://www.mystackvarsity.com`, sitemap, robots policy, Open Graph, structured data where applicable, noindex for private/admin pages, metadata per public route. Establish redirects from the apex `mystackvarsity.com` to `www.mystackvarsity.com` (or the reverse only if the canonical domain is later explicitly changed).

---

## 5. Learner experience and pages

### 5.1 Protected learner routes

| Route                              | Required functionality                                                           |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| `/dashboard`                       | Continue learning, active courses, upcoming tasks, latest results, quick actions |
| `/dashboard/my-courses`            | Purchased/enrolled courses and completion status                                 |
| `/dashboard/learning-paths`        | Path progress and next recommended action                                        |
| `/dashboard/certifications`        | Certification tracks, domain coverage and performance                            |
| `/dashboard/practice`              | Topic quizzes, missed-question review, practice history                          |
| `/dashboard/exams`                 | Available, active and completed mock exams                                       |
| `/dashboard/results`               | Exam history, filters, trend summary                                             |
| `/dashboard/results/[attemptId]`   | Scores, domain breakdown, explanations when released                             |
| `/dashboard/progress`              | Lesson/course performance, strengths and remediation                             |
| `/dashboard/certificates`          | Verifiable **Stack Varsity course-completion** credentials                       |
| `/dashboard/billing`               | Orders, receipts, payments, eligible refunds                                     |
| `/dashboard/notifications`         | Security and course notices                                                      |
| `/dashboard/settings`              | Profile, password, active sessions, privacy preferences, account requests        |
| `/learn/[courseSlug]/[lessonSlug]` | Video/text lesson player, outline, resource downloads, completion, previous/next |
| `/exam/[attemptId]`                | Timed question interface, navigation, autosave, flag/review, submit              |

### 5.2 Course player

- Curriculum sidebar on desktop, collapsible navigation on mobile.
- Content types: rich text, video, PDF/handouts, interactive examples, downloadable exercises, quiz/assignment.
- Progress persistence and server-authoritative completion conditions.
- Graceful resumption following network interruption; access must be checked for every protected resource.
- Secure media delivery: private objects, short-lived authorized download links or proxy where needed; never rely on hidden UI controls as authorization.
- Instructor-issued course completion only on verified requirements; separate credential verification endpoint with privacy-conscious metadata.

### 5.3 Student onboarding

Register → verify email → select interest → browse course → enroll/purchase → open introductory lesson → complete first assessment → dashboard re-entry. Every step requires clear loading, empty, error and confirmation states.

---

## 6. Authentication, accounts and access control

### 6.1 Account workflows

- Registration with name, email, password, explicit acceptance of required terms.
- Email verification using single-use expiring tokens.
- Secure login, logout, password changes and reset.
- Session expiration, revocation and optional device/session listing.
- Rate limits and bot/credential-stuffing defenses; generic error responses to reduce account enumeration.
- MFA mandatory for privileged administrators; optional for students when implemented.
- Privacy and account lifecycle requests (export, deletion subject to lawful retention, communication preferences).

### 6.2 Role and permission model

Roles initially: **Student, Instructor, Content Manager, Support, Administrator, Super Administrator**. Do not grant role privileges based solely on client-supplied data. Attach explicit permissions such as `courses:publish`, `questions:approve`, `users:manage`, `payments:refund`, and `audit:view`.

Enforce **RBAC + object-level ownership/entitlements** on every backend operation. Test against IDOR/BOLA: students cannot fetch others' attempts; instructors cannot change unassigned courses; support agents cannot change payment records unless explicitly authorized.

---

## 7. Course, certification and assessment domains

### 7.1 Learning data model

`categories`, `courses`, `course_versions`, `modules`, `lessons`, `lesson_resources`, `learning_paths`, `learning_path_courses`, `enrollments`, `lesson_progress`, `course_progress`, `instructor_assignments`, `completion_certificates`.

Course workflow: **Draft → Content Review → Approved → Published → Updated/Archived**. Publish only when required metadata, access terms, lessons and assessment rules exist. Preserve previous course versions or equivalent audit history for learners currently enrolled.

### 7.2 Certification data model

`certification_vendors`, `certifications`, `certification_versions`, `exam_domains`, `exam_objectives`, `certification_course_mappings`, `blueprints`.

Each program records vendor, current exam code, version effective dates, sourced objectives, domain weights, estimated study commitment, official exam reference URL and review dates. Content must be refreshed when vendors update their certification exams.

### 7.3 Question bank

Support initially:

1. Single-choice.
2. Multiple-response.
3. True/false.

Later: matching, ordering, simulations and isolated labs.

Store: immutable question revision, question type, stem, options, valid answer set, rationale, learning objective mapping, topic tags, estimated difficulty, references, author, reviewer, review status, timestamps and media assets.

Question lifecycle: **Draft → Technical Review → Instructional Review → Approved → Published → Retired**. Only approved published questions enter learner exams. Require original or licensed assessment content; prohibit unauthorized exam dumps.

### 7.4 Exam engine — essential invariants

- **Practice mode:** Immediate answer feedback/explanations.
- **Topic quiz:** Topic-filtered questions, configurable feedback.
- **Timed practice:** Countdown and post-submission results.
- **Mock exam:** Blueprint-defined question mix, server-enforced duration, delayed explanations.
- Exam attempts are created server-side and owned by one user.
- Freeze assigned questions, order, blueprint and scoring rules at attempt start.
- Correct answer keys are **never included in active attempt payloads**.
- Persist answer changes atomically and validate ownership and deadline.
- Browser refresh cannot reset the server-calculated deadline.
- Submission must be idempotent; no mutation after finalized/expired status.
- Results derive from backend scoring; preserve historical attempt snapshots despite question edits.
- Use transactions/locking to prevent double submission and race conditions.
- Record started/completed/expired/abandoned statuses; define resume and interruption policies.

### 7.5 Exam analytics and integrity

Capture attempt counts, percent correct, objective/domain breakdown, average time, missed concepts, retake trends, and recommendations. A readiness score, if shown, is an **estimate** with clearly documented weights and limitations—not a pass guarantee. Review anomalous question results and retire defective items without corrupting historical scores.

---

## 8. Backend modules and APIs

### 8.1 Backend module convention

```text
src/modules/<domain>/
├── routes.ts         # HTTP route definitions
├── controller.ts     # HTTP input/output mapping
├── service.ts        # business logic and transactions
├── repository.ts     # database queries
├── schema.ts         # runtime validation
├── types.ts
└── *.test.ts
```

Cross-cutting: request IDs, structured errors, authentication, authorization, validation, rate limiting, idempotency, observability, audit events, pagination and API versioning.

### 8.2 Primary endpoint inventory (target contracts)

| Domain         | Method and route                          | Purpose                                         |
| -------------- | ----------------------------------------- | ----------------------------------------------- |
| Auth           | `POST /auth/register`                     | Create user                                     |
| Auth           | `POST /auth/login`                        | Authenticate                                    |
| Auth           | `POST /auth/logout`                       | Revoke current session                          |
| Auth           | `POST /auth/refresh`                      | Refresh only if token model used                |
| Auth           | `GET /auth/me`                            | Current account                                 |
| Auth           | `POST /auth/verify-email`                 | Verify email token                              |
| Auth           | `POST /auth/forgot-password`              | Request reset without leaking account existence |
| Auth           | `POST /auth/reset-password`               | Single-use reset                                |
| Auth           | `GET /auth/sessions`                      | List sessions                                   |
| Auth           | `DELETE /auth/sessions/:id`               | Revoke session                                  |
| Courses        | `GET /courses`                            | Public published list                           |
| Courses        | `GET /courses/:slug`                      | Public course details                           |
| Courses        | `POST /courses`                           | Authorized create                               |
| Courses        | `PATCH /courses/:id`                      | Authorized update                               |
| Courses        | `POST /courses/:id/publish`               | Reviewed publish                                |
| Courses        | `GET /courses/:id/modules`                | Syllabus                                        |
| Enrollment     | `GET /me/enrollments`                     | Learner courses                                 |
| Enrollment     | `POST /courses/:id/enroll`                | Free or entitlement-backed enrollment           |
| Learning       | `GET /me/courses/:id/progress`            | Private progress                                |
| Learning       | `PUT /me/lessons/:id/progress`            | Validated completion update                     |
| Certifications | `GET /certifications`                     | Program directory                               |
| Certifications | `GET /certifications/:slug`               | Program details                                 |
| Certifications | `GET /certifications/:id/domains`         | Blueprint data                                  |
| Questions      | `POST /admin/questions`                   | Create question                                 |
| Questions      | `POST /admin/questions/:id/submit-review` | Submit review                                   |
| Questions      | `POST /admin/questions/:id/approve`       | Approve                                         |
| Questions      | `POST /admin/questions/:id/publish`       | Publish                                         |
| Exams          | `GET /exams`                              | Available exams                                 |
| Exams          | `POST /exams/:id/attempts`                | Begin attempt                                   |
| Exams          | `GET /attempts/:id`                       | Secure attempt payload                          |
| Exams          | `PUT /attempts/:id/answers/:questionId`   | Save answer                                     |
| Exams          | `POST /attempts/:id/submit`               | Finalize exam                                   |
| Exams          | `GET /attempts/:id/results`               | Authorized result                               |
| Orders         | `POST /orders`                            | Create server-calculated order                  |
| Payments       | `POST /payments/initialize`               | Create hosted checkout                          |
| Payments       | `POST /webhooks/payments/:provider`       | Signed webhook handler                          |
| Billing        | `GET /me/orders`                          | Private order history                           |
| Admin          | `GET /admin/reports/overview`             | Permissioned analytics                          |
| Operations     | `GET /health/live`                        | Process liveness                                |
| Operations     | `GET /health/ready`                       | Dependency readiness                            |

Public operations should not be conflated with admin mutations. Use consistent typed response and error envelopes, cursor-based or bounded offset pagination, explicit filtering and versioned OpenAPI. Exact API shapes must be finalized in ADRs before frontend/backend integration.

---

## 9. Database and storage

### 9.1 Primary relational entities

| Domain         | Tables (initial design)                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Identity       | `users`, `roles`, `permissions`, `user_roles`, `sessions`, `verification_tokens`, `password_reset_tokens`                                                                                        |
| Education      | `categories`, `courses`, `course_versions`, `modules`, `lessons`, `lesson_resources`, `enrollments`, `lesson_progress`, `learning_paths`                                                         |
| Certifications | `vendors`, `certifications`, `certification_versions`, `exam_domains`, `exam_objectives`                                                                                                         |
| Assessment     | `questions`, `question_revisions`, `question_options`, `question_reviews`, `exams`, `exam_blueprints`, `exam_attempts`, `attempt_questions`, `attempt_answers`, `exam_results`, `domain_results` |
| Commerce       | `products`, `prices`, `orders`, `order_items`, `payments`, `payment_events`, `refunds`, `entitlements`, `subscriptions` (optional)                                                               |
| Operations     | `audit_logs`, `notifications`, `notification_preferences`, `job_queue`, `system_settings`, `completion_certificates`                                                                             |

### 9.2 Database rules

- Stable UUID keys (or equivalent consistent IDs), foreign keys, uniqueness and check constraints.
- UTC timestamps with timezone-aware columns; currency in integer minor units or exact decimal, never IEEE floating point.
- Unique email normalization policy; provider payment-reference uniqueness; idempotency records for checkout and webhook processing.
- Model immutable exam attempt snapshots; version courses and question content.
- Encrypt at rest where infrastructure supports it, and enforce encrypted database access in deployed environments.
- Separate application and schema-migration database roles.
- Review and measure indexes, query plans, N+1 patterns and pagination limits.
- Migrations are version-controlled; test forward application and data-safe rollback/forward-recovery plans.
- Clearly define retention schedules for personal data, orders, exam history and audit logs.

### 9.3 Uploaded content

Private media and paid assets must use access-controlled object/file storage; downloadable links should be short-lived or otherwise authorized. Implement content-type and file-signature checks, size limits, malware scanning as practical, safe filenames, storage quotas and orphan cleanup. Do not host arbitrary executable uploads in a public directory.

---

## 10. Commerce, checkout and payment lifecycle

### 10.1 Commercial model

Start with **individual paid courses** and **certification preparation packages**, optionally free introductory programs. Membership/subscription plans are postponed unless a pricing model and entitlement rules are approved.

**Primary displayed currency:** GHS. Display transparent payment costs, access periods and refund conditions.

### 10.2 Paystack integration approach

Paystack is the initial candidate for Ghana-compatible hosted payments, contingent on current merchant onboarding, supported methods and contractual verification.

Payment workflow:

1. Student selects a product.
2. Server creates order and calculates authoritative amount/currency.
3. Server initializes hosted checkout; client receives only safe redirect information.
4. Provider emits signed event to the secure webhook endpoint.
5. Backend verifies provider authenticity, reference, amount, currency and status against authoritative records.
6. Webhook event is recorded idempotently; order/payment transitions execute transactionally.
7. Entitlement is granted exactly once, then confirmation email/job is queued.
8. Failed, reversed, refunded and disputed payments trigger documented access and accounting rules.

Never accept the browser's “payment successful” message as proof. Never store raw card details or CVV. Maintain reconciliation jobs, failure alerts and a support-friendly transaction trail.

### 10.3 Refund and entitlement model

Define entitlement start/end date, assigned user, product, status, grant source and revocation reason. Refunds require policy checks, authorized approvers, provider verification and immutable financial event history.

---

## 11. Administration and content operations

### 11.1 Admin routes

| Route                   | Function                                                |
| ----------------------- | ------------------------------------------------------- |
| `/admin`                | KPI dashboard and operational alerts                    |
| `/admin/users`          | Users, statuses, role assignments                       |
| `/admin/roles`          | Least-privilege permissions                             |
| `/admin/courses`        | Course lifecycle                                        |
| `/admin/categories`     | Taxonomy                                                |
| `/admin/lessons`        | Lesson authoring and resources                          |
| `/admin/certifications` | Vendors, programs, blueprint versions                   |
| `/admin/question-bank`  | Create, review, publish and retire items                |
| `/admin/exams`          | Mock exam blueprints, publication and attempts          |
| `/admin/enrollments`    | Student access and support actions                      |
| `/admin/orders`         | Order records                                           |
| `/admin/payments`       | Transactions, refunds, reconciliation                   |
| `/admin/certificates`   | Course-completion credentials                           |
| `/admin/reports`        | Enrollments, learning, exam metrics, sales              |
| `/admin/audit-logs`     | Investigable high-risk changes                          |
| `/admin/settings`       | Approved business settings, templates and feature flags |

### 11.2 Instructor and content manager

Give instructors scoped access to assigned courses, lesson authoring, learner progress and appropriate question drafting. Only reviewers/publishers may release certification questions; separate authoring and approval roles when capacity permits. Student-facing analytics must comply with the organization's privacy policy.

### 11.3 Audit log design

Record timestamp, actor, role, request ID, action, target object, outcome and minimal change metadata. High-risk entries: role changes, refunds, course/exam publication, answer-key changes, credential revocations and settings updates. Protect logs from ordinary user modification, apply retention policy, and never log passwords or complete authentication tokens.

---

## 12. Security and privacy engineering

### 12.1 Security baseline

Use **OWASP ASVS 5.0** as a verification framework, with a risk-based Level 2 target for the application and stronger requirements around admin and payment functions. Also apply OWASP API Security Top 10, a documented threat model and secure dependency management. Validate the applicable Ghana Data Protection Act requirements and other relevant laws with qualified counsel before launch; this document is not legal advice.

### 12.2 Controls by layer

**Identity and sessions**

- Argon2id password hashing with deployment-appropriate parameters.
- Single-use, short-lived password-reset/verification tokens stored as secure hashes where appropriate.
- Session rotation after login/elevation, timeout, revocation and cookie security.
- MFA for administrator access, protected recovery workflows.
- Rate limiting and abuse detection for auth and contact endpoints.

**Authorization**

- Backend RBAC plus object-level checks and explicit entitlements.
- Deny by default and least privilege.
- Permissions tested for students, instructors, support and administrators.

**Application and browser**

- Runtime input validation (e.g. Zod), output encoding, safe rich text sanitization.
- Parameterized SQL; no string-concatenated queries.
- CSP, HSTS, X-Content-Type-Options, Referrer-Policy, framing restrictions, `Secure`/`HttpOnly`/`SameSite` cookies.
- CSRF controls for cookie-authenticated mutation endpoints.
- Restrictive CORS; prefer same-origin browser API access.
- Upload limits, MIME/magic-byte verification, path traversal controls.
- Error responses that exclude stacks, database internals, secrets and PII.

**Operations and supply chain**

- Secret scanning and dependency/SAST scans in CI.
- Dependabot or equivalent dependency update policy.
- Least-privilege workflow tokens and GitHub branch protections.
- Encrypted backups, tested restores, separate database accounts and network restrictions.
- Centralized structured logs with retention, alerting and redaction.
- Document incident-response and vulnerability disclosure/reporting process.

### 12.3 Privacy-by-design

- Collect only necessary student data; explain purposes and lawful basis.
- Publish privacy notice, terms, refund policy and cookie notice as needed.
- Support appropriate access, correction, deletion/export and consent/communication preferences.
- Document third-party processors: payment provider, email service, hosting/media provider and analytics.
- Avoid unnecessary tracking scripts; do not expose learning, exam or purchase data to unrelated parties.
- Apply explicit retention schedules, privacy-safe telemetry and deletion exceptions for lawful financial/audit retention.

### 12.4 Security release blockers

No release with unresolved critical/high vulnerabilities without a formally approved, time-bound risk treatment; no publicly accessible answer keys; no unverified payment entitlements; no exposed secrets; no unauthenticated private data or privileged admin actions.

---

## 13. Email, communications and brand configuration

### 13.1 Public contact identity

- **Canonical site:** `https://www.mystackvarsity.com`
- **Public support/contact:** `hello@mystackvarsity.com`
- Display the public email in footer, contact page, help instructions, transactional email signatures and appropriate policies.

### 13.2 Email infrastructure

Plan for branded sender and authenticated domain configuration (SPF, DKIM and DMARC) with the selected email service. Email transactional events include verification, reset, enrollment, receipts, course completion, exam completion and security notices. Queue asynchronous email sends with retry/backoff and a dead-letter/failure workflow. Keep marketing mail separate from essential transactional communications and respect preferences.

### 13.3 Example public content configuration

```dotenv
NEXT_PUBLIC_SITE_URL=https://www.mystackvarsity.com
PUBLIC_CONTACT_EMAIL=hello@mystackvarsity.com
BRAND_NAME=Stack Varsity
BRAND_TAGLINE=Build • Educate • Innovate
```

Never use `NEXT_PUBLIC_*` for secrets. The above is safe public metadata only.

---

## 14. Development environment and engineering standards

### 14.1 Local prerequisites

Supported Node.js LTS release, npm matching the lockfile, Git, PostgreSQL, Docker Compose (optional if PostgreSQL is installed locally), a code editor and browser test dependencies. Pin versions in `.nvmrc` or `.node-version` and `engines` after verifying runtime compatibility.

### 14.2 Proposed local workflow

```bash
# Once V1 project setup scripts have been implemented:
git clone https://github.com/ometman/stackvarsity-v1.git
cd stackvarsity-v1
npm ci
cp .env.example .env
docker compose up -d db
npm run db:migrate
npm run db:seed
npm run dev
```

**These commands describe the target developer experience; they are not asserted to work in the current repository until implemented.**

Suggested local service endpoints:

- Frontend: `http://localhost:3000`
- API: `http://localhost:4000/api/v1`
- API liveness: `http://localhost:4000/health/live`

Provide a local email catcher, sandbox payment setup, seed learner/admin accounts restricted to development, and a documented database reset routine. Never use real student records in local development.

### 14.3 Environment variable classes

- **Public:** canonical URL, nonsecret site branding, payment **publishable** key where applicable.
- **Server-only:** session secret, database credentials, SMTP/API credentials, payment secret/webhook secrets, storage credentials.
- **Per-environment:** `development`, `test`, `staging`, `production` isolated settings and credentials.

Maintain `.env.example` with placeholders only, schema-validate environment variables at app startup, and reject missing production secrets rather than silently using insecure defaults.

### 14.4 Coding standards

TypeScript strict mode, ESLint, Prettier, schema validation, descriptive error handling, small cohesive functions, no business logic in React presentation components, deterministic migrations, minimal global state, and architectural ADRs for nontrivial changes. Ban silent exception swallowing and sensitive values in log statements.

---

## 15. Testing and verification strategy

### 15.1 Test pyramid

- **Unit:** assessment scoring, domain coverage, entitlement rules, validation, auth helpers and progression.
- **Integration:** Express routes, PostgreSQL transactions, sessions, concurrency, payment webhook idempotency and authorized access.
- **E2E (Playwright):** registration → enrollment → lesson → exam → results; purchase (sandbox); admin course/question publication; reset and logout.
- **Security:** BOLA/IDOR, privilege escalation, injection, XSS, CSRF, upload abuse, auth abuse, answer-key leakage, checkout manipulation.
- **Performance:** API latency, DB query plans, simultaneous mock exams, payment event spikes and mobile page performance.
- **Accessibility:** automated checks plus manual keyboard/screen-reader review.

### 15.2 Mandatory E2E journeys

1. Register and verify email.
2. Log in, log out and invalidate session.
3. Reset password safely.
4. Browse/filter courses and certifications.
5. Enroll in free course; open protected lesson.
6. Complete course requirements and see correct progress.
7. Pay for a package in sandbox and gain access **after backend verification**.
8. Reject tampered amounts, forged/duplicate webhooks and unauthorized access.
9. Start timed exam, save answers, refresh/resume, submit once, see result.
10. Reject reading another student's exam attempt or answers.
11. Admin authors, reviews and publishes a course and questions.
12. Restore backup to isolated environment and verify data integrity.

### 15.3 Baseline measurable targets

| Area            | Initial target / gate                                                                      |
| --------------- | ------------------------------------------------------------------------------------------ |
| Core Web Vitals | LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1 at p75 of representative field data                      |
| Accessibility   | WCAG 2.2 AA target; no unresolved critical accessibility defects                           |
| API             | ≥95% typical read requests under 500 ms at defined baseline load; external delays excluded |
| CI              | Lint/typecheck/unit/integration/build/security checks pass                                 |
| Payments        | Replayed/duplicate webhooks never double-grant entitlements                                |
| Exam integrity  | Server timing and scoring correct under concurrent/retry conditions                        |
| Backup          | Successful documented restore test before launch                                           |
| Vulnerabilities | No unaccepted critical/high findings                                                       |

Performance numbers are **provisional acceptance targets**, not a claim about current performance. Baseline workload and test environment must be documented.

---

## 16. CI/CD, deployment readiness and operations

### 16.1 CI workflow

Pull request pipeline: install pinned dependencies → formatting/lint → TypeScript → unit tests → database-backed integration tests → contract checks → dependency/secret/SAST scans → production build → optionally Playwright smoke checks. Required jobs protect `main`.

### 16.2 Environments

- **Development:** local machines and local services.
- **Testing:** isolated test database and sandbox integrations.
- **Staging:** production-like rehearsal, separate data and secrets.
- **Production:** selected only when hosting/deployment has been approved.

No automatic cloud deployment is required during initial local development. Define deployment as reproducible configuration and scripts, not a vendor-specific commitment.

### 16.3 Release strategy

Use semantic release tags (`v0.x` until launch; `v1.0.0` after all gates), release notes, schema migration plan, smoke tests, rollback/forward-recovery decision, backup verification, monitoring checks, and a documented go/no-go approval. Run canary/limited user rollout if hosting supports it.

### 16.4 Production operations

- HTTPS/TLS, secure reverse proxy, monitored DNS and canonical redirect from apex to `www`.
- Managed certificates or documented certificate rotation.
- Health/liveness/readiness endpoints and request correlation IDs.
- Structured logs and metrics: uptime, request latency, errors, DB connections, queue failures, payment event failures, failed login anomaly rates.
- Alert contacts and on-call responsibilities appropriate to a small team.
- Security patching, rotation and periodic review calendar.
- Database backup and media backup with off-device copies, encryption and restore drills.

### 16.5 Business continuity

Planning targets: recovery time objective (RTO) **4 hours** and recovery point objective (RPO) **24 hours for ordinary learning content**, with stronger transactional controls for payments and exam results. These targets are only commitments after infrastructure and restore drills demonstrate capability. Implement payment reconciliation against provider records.

---

## 17. Content quality and education governance

- Define learning objectives and prerequisites per course.
- Align certification material to current official vendor exam guides; record version and last-reviewed date.
- Require subject matter review of answer correctness, explanations and difficulty.
- Use original/licensed questions only; no “real leaked exam questions” marketing.
- Review learner feedback for ambiguous items; preserve attempt history when correcting an item.
- Clearly distinguish **Stack Varsity-issued completion certificates** from third-party professional credentials.
- Add instructor attribution, content licensing and resource citations where appropriate.
- Pilot course content with a small learner group before broad paid release.

---

## 18. Reporting, KPIs and business intelligence

### 18.1 Learning metrics

Course enrollment, active learners, lesson completion, quiz pass rate, path completion, study streak (optional), course drop-off, reassessment performance, objective/domain weaknesses, mock exam participation and retention.

### 18.2 Commercial metrics

Course-to-checkout conversion, completed payments, gross/net revenue, average order value, refunds, payment failure rates, acquisition source (privacy-appropriate), repeat purchases and customer support burden.

### 18.3 Reliability metrics

Availability, p95 API latency, incident count, error budget, queue failures, failed login anomalies, backup success and restore time.

All metrics require defined calculation rules and time windows, a single authoritative source, and access controls on student/financial data. Avoid misleading “certification pass rate” claims unless independently substantiated.

---

## 19. Phased implementation roadmap

The phases below are **dependency-ordered, not fixed-duration promises**. Complexity and duration must be estimated from the legacy audit and team capacity.

| Phase  | Focus                                  | Primary output                                           | Exit gate                                       |
| ------ | -------------------------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| **0**  | Legacy audit + new repo initialization | V1 baseline, migration decisions, backlog                | Repo reproducible; risks documented             |
| **1**  | Engineering foundation                 | Monorepo/workspace, TS, DB migration, CI, contracts      | Fresh install/build/tests pass                  |
| **2**  | Identity and authorization             | Registration, sessions, MFA for admin, RBAC              | Auth/security tests pass                        |
| **3**  | Public website + brand                 | Responsive pages, SEO, contact/legal                     | Responsive and accessible site approved         |
| **4**  | LMS core                               | Courses, lessons, player, enrollment, progress           | Learner completes end-to-end free course        |
| **5**  | Certification content architecture     | Vendors, blueprints, reviewable question bank            | Reviewed question set published                 |
| **6**  | Practice and mock exams                | Secure attempts, timers, scoring, results                | End-to-end exam and concurrency tests pass      |
| **7**  | Commerce                               | Orders, hosted checkout, verified webhooks, entitlements | Sandbox payment/reconciliation tests pass       |
| **8**  | Operations and admin                   | Reports, user/content/payment management, email          | Admin workflows and audit logs pass             |
| **9**  | Hardening / release candidate          | Load/security/accessibility/restore rehearsal            | All production acceptance gates met             |
| **10** | Controlled launch                      | Approved hosting, DNS, HTTPS, live payment onboarding    | Monitoring, smoke tests, rollback plan approved |

**Scope discipline:** Do not start AI tutoring, arbitrary code execution or a social forum before exam, payment, and security fundamentals are complete.

### 19.1 Immediate implementation backlog (first 20 issues)

1. Initialize and protect `stackvarsity-v1` repository.
2. Add this plan and contributor documentation.
3. Audit legacy code and licenses.
4. Record architecture ADRs.
5. Pin Node/npm versions and workspace tooling.
6. Add TypeScript strict configuration.
7. Add lint/format/pre-commit checks.
8. Add local PostgreSQL development environment.
9. Establish database schema and migration tooling.
10. Create shared Zod/OpenAPI contracts.
11. Add API error envelope and request ID middleware.
12. Implement structured logging and health endpoints.
13. Configure unit/integration/Playwright test framework.
14. Add GitHub Actions CI and secret scanning.
15. Implement secure registration/login/session model.
16. Implement RBAC and authorization test matrix.
17. Define brand tokens and base page layouts.
18. Build public homepage, course listing and details.
19. Implement LMS course and lesson CRUD.
20. Implement enrollment, entitlements and student progress.

Each issue must define scope, dependencies, acceptance criteria, testing expectations, and security considerations.

---

## 20. Roles, responsibility and project management

The first implementation may be carried out by a solo technical lead, but responsibilities must remain explicit:

| Responsibility         | Core accountability                             |
| ---------------------- | ----------------------------------------------- |
| Product owner          | Priority, acceptance, commercial rules          |
| Technical lead         | Architecture, code quality, release approval    |
| Frontend engineer      | UI/UX, accessibility, page implementation       |
| Backend engineer       | APIs, authorization, exam/commerce logic        |
| Database owner         | Migrations, data integrity, backup              |
| Security reviewer      | Threat model, findings, release gates           |
| Education/content lead | Syllabi, question correctness, version tracking |
| QA owner               | Test plans, defects, acceptance evidence        |
| Operations owner       | Monitoring, restoration, incident response      |

One person may fill multiple roles, but should maintain separate checklists and records.

### 20.1 Definition of Ready

Business rule documented; user story specified; dependency assessed; schema/API changes identified; acceptance tests defined; privacy/security impacts recorded.

### 20.2 Definition of Done

Implementation merged; lint/types/build/tests pass; sensitive paths authorized; migrations validated; accessibility checked; documents updated; no release-blocking defect; observable error behavior established.

---

## 21. Risk register

| Risk                                         | Severity | Mitigation                                         |
| -------------------------------------------- | -------- | -------------------------------------------------- |
| Legacy code imported with vulnerabilities    | High     | Audit, scans, selective porting                    |
| Exam keys exposed or client-side scored      | Critical | Server-authoritative scoring and secure payloads   |
| Unauthorized access to attempts/content      | Critical | RBAC + BOLA test suite                             |
| Duplicate/forged payment confirmations       | Critical | Signed webhooks, server verification, idempotency  |
| Course/payment migration damages data        | High     | Tested migrations, backups, rollback strategy      |
| Outdated or inaccurate certification content | High     | Versioned official objectives and review workflow  |
| Unauthorized copyrighted questions           | High     | Original/licensed content policy                   |
| Poor experience on mobile/slow connections   | High     | Mobile/low-bandwidth testing                       |
| Scope creep delays first release             | High     | P0/P1 gates; defer post-launch features            |
| Student privacy breach                       | Critical | Least privilege, privacy design, incident response |
| Media storage loss                           | High     | Backups and restore tests                          |
| Inadequate support workflow                  | Medium   | Contact form, support triage, admin tooling        |
| Domain/email misconfiguration                | Medium   | DNS/TLS/SPF/DKIM/DMARC checks                      |

---

## 22. Production go/no-go checklist

**Product and legal**

- [ ] All required P0/P1 features and policy pages approved.
- [ ] Content rights and current vendor exam versions verified.
- [ ] Prices, access periods and refund rules published.
- [ ] Official-certification non-affiliation language present where needed.

**Security and privacy**

- [ ] Admin MFA enforced.
- [ ] Authentication, BOLA/IDOR and role checks tested.
- [ ] No client-side active-exam answer keys.
- [ ] Payment webhooks verified and idempotent.
- [ ] No leaked credentials or unaccepted critical/high vulnerabilities.
- [ ] Privacy, data retention and processor inventory approved.

**Engineering and QA**

- [ ] Clean dependency install and production build.
- [ ] Migrations tested on representative data.
- [ ] Critical E2E and integration tests pass.
- [ ] Mobile, WCAG, Core Web Vitals and API load targets assessed.
- [ ] Logging, metrics and alerts working.

**Operations**

- [ ] Canonical `https://www.mystackvarsity.com` reachable over HTTPS.
- [ ] Apex-domain redirect, sitemap and robots policy correct.
- [ ] `hello@mystackvarsity.com` contact and sending-domain settings verified.
- [ ] Backups completed and restore rehearsal passed.
- [ ] Payment sandbox-to-live transition verified with controlled transactions.
- [ ] Incident response, rollback/forward recovery and support ownership assigned.
- [ ] Release notes, version tag and go/no-go decision recorded.

---

## 23. Required deliverables and document register

```text
README.md
CHANGELOG.md
CONTRIBUTING.md
SECURITY.md
.env.example

docs/
├── MASTER_PLAN.md                    # this document
├── audits/
│   ├── legacy-audit.md
│   ├── feature-inventory.csv
│   └── dependency-risk-register.md
├── architecture/
│   ├── system-context.md
│   ├── module-diagram.md
│   ├── data-model.md
│   └── deployment-model.md
├── decisions/
│   └── ADR-0001-architecture.md
├── product/
│   ├── requirements.md
│   ├── user-stories.md
│   ├── roadmap.md
│   ├── ux-flows.md
│   └── acceptance-criteria.md
├── api/
│   └── openapi.yaml
├── security/
│   ├── threat-model.md
│   ├── authorization-matrix.md
│   ├── asvs-checklist.md
│   ├── data-retention.md
│   └── incident-response.md
├── development/
│   ├── local-setup.md
│   ├── coding-standards.md
│   ├── testing.md
│   └── migration-guide.md
└── operations/
    ├── release-runbook.md
    ├── rollback-recovery.md
    ├── backup-restore.md
    ├── monitoring-alerting.md
    └── payment-reconciliation.md
```

---

## 24. Key decisions and unresolved items

### 24.1 Decisions already fixed

- New V1 repository: **`https://github.com/ometman/stackvarsity-v1.git`**.
- Existing `stackvarsity` repo is **legacy reference only**.
- Canonical public web domain: **`https://www.mystackvarsity.com`**.
- Public email: **`hello@mystackvarsity.com`**.
- Main business direction: digital skills education and professional certification preparation.
- Local development remains the default; no cloud deployment assumption.
- Keep initial platform focused; prioritize reliable LMS, exam preparation and commerce.

### 24.2 Items requiring implementation-time decisions

- Actual legacy code suitability and migration inventory.
- Supported runtime/framework versions and ORM/query library.
- Brand asset/design-token approval.
- Initial 2–3 launch programs and first question-bank subjects.
- Pricing, access lengths, refunds and course copyright ownership.
- Session implementation details and selected email service.
- Payment provider onboarding details and supported Ghanaian payment methods.
- Video/media storage strategy and geographic performance testing.
- Hosting provider and precise production architecture **only when deployment is requested**.
- Legal/privacy reviews, organizational policies and launch owner sign-off.

---

## 25. Final implementation directive

**Build Stack Varsity V1 as a secure, maintainable, local-first, production-ready modular learning platform.** Treat the new GitHub repository as the single source of truth, selectively reuse audited legacy assets, and prioritize this dependency order:

**Repository baseline → Engineering foundation → Identity/security → Public site → LMS → Certification content → Secure examinations → Payments/entitlements → Administration → Hardening → Approved release.**

A polished homepage is not an adequate release criterion. A production release requires accurate educational content, protected learning data, secure payment authorization, trustworthy exam results, reliable recovery, documented operations and end-to-end tested student journeys.

**End of Stack Varsity V1 Development Master Plan — v1.0**
