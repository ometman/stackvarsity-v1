# STACK VARSITY V1 — PHASE 5 MASTER DEVELOPMENT PLAN

**Phase:** 5 — Professional Certification Preparation  
**Project:** Stack Varsity V1  
**Brand:** Stack Varsity — *Build • Educate • Innovate*  
**Website:** https://www.mystackvarsity.com  
**Contact:** hello@mystackvarsity.com  
**Repository:** https://github.com/ometman/stackvarsity-v1.git  
**Architecture:** Next.js App Router modular monolith; TypeScript; PostgreSQL + Prisma  
**Execution mode:** Local-first, autonomous AI coding agent with per-step validation, commit and push  
**Source branch:** Next unused consecutively numbered `feature/NNN-phase-5-certification-preparation`  
**PR base:** `development` — **manual review and merge by owner**  
**Owner-only promotions:** `development` → `Staging-I` → `Staging-II` → `main`  
**Prepared:** 14 November 2026  

> **Repository alignment note:** This is the Phase 5 implementation specification derived from the previously agreed Stack Varsity phase sequence and Phase 4 plan. The live repository, current implementation and `docs/MASTER_PLAN.md` were not available for direct inspection while writing. Before coding, the implementing agent MUST read the repository's approved master plan, Phase 4 completion report, actual database schema, API routes, installed package versions and existing certification pages. Respect approved requirements over illustrative details here. Stop only for material conflicts, unsafe changes or genuinely required owner input. This document does **not** assert that Phase 4 has been implemented or merged.

---

## 1. Executive summary

Phase 5 extends Stack Varsity's LMS with **structured professional certification preparation**. Learners can discover certification tracks, review explicitly sourced exam objectives, map relevant courses and lessons to domains, select a preparation pathway, follow a study plan, practice with low-stakes objective-aligned questions, view explanations and progress, and understand their coverage gaps. Authorized authors and administrators can maintain versioned certification catalogues, blueprints, learning mappings, practice items and study-plan templates.

**Learner journey:** Discover certification → inspect provider/exam version and objectives → choose or access an authorized preparation track → assess initial coverage preferences (not a scored exam) → follow a study schedule → consume linked LMS lessons → practice with formative questions → review explanations and track domain coverage → see next recommended study actions.

**Staff journey:** Create a provider and certification draft → record exam version and source references → define objective domains and weights → map LMS courses/lessons → author and review original practice questions → approve/publish a track → monitor basic aggregate coverage and correct stale content.

**Critical separation:** Phase 5 provides **formative practice and preparedness support**, not the Phase 6 formal assessment engine. Do not implement high-stakes/timed mock examinations, exam scheduling, proctoring, grading policies, score reports, pass/fail claims or digital credentials in Phase 5. Phase 7 owns payment and subscriptions. Phase 8 owns full administration/reporting.

### Primary outcomes

1. Extensible certification provider / credential / exam-version catalogue.
2. Versioned, sourced exam-blueprint domains and objectives, with explicit status and effective dates where available.
3. Authorized mappings from objectives to existing LMS courses/sections/lessons/resources.
4. Public, SEO-friendly certification track discovery and details integrated with Phase 3, without duplicate route ownership.
5. Enrollment/entitlement-aware learner certification-preparation workspace integrated with Phase 4.
6. Study-plan templates and personalized schedules with durable progress and rescheduling rules.
7. Original, licensed or otherwise authorized **formative** practice items; explanations, references and review flow.
8. Domain-level coverage insights that distinguish **study progress** from **exam readiness**.
9. Scoped author/reviewer/admin content operations, versioning and audit trails.
10. Full testing, accessibility/security/performance checks, documentation and PR handoff.

---

## 2. Entry gate and dependency verification

Before writing code, the agent SHALL:

1. Inspect `git status`, current branch, remote URL, existing feature branches, recent commits and open PRs. `git fetch origin --prune` only when safe. Preserve unrelated user work.
2. Read `docs/MASTER_PLAN.md`, Phase 3/4 plans and completion reports, project structure, coding standards, database, authentication, UI/design system, test strategy, environment configuration and security documents. If a file is missing, record it instead of inventing its contents.
3. Verify that Phase 2 authentication, RBAC and administrator MFA are implemented and functional. Check trusted role and resource authorization methods rather than trusting client claims.
4. Verify Phase 3 certification discovery routes, slugs, canonical URLs and public SEO contracts; reuse existing pages rather than adding duplicate route groups.
5. Verify Phase 4 course/lesson identifiers, publication states, enrollment entitlements, instructor assignments, progress and student workspace. Understand whether certification tracks require their own access entitlement or inherit LMS-course access.
6. Inspect the installed Next.js, Prisma, PostgreSQL, Auth.js, Zod, Tailwind, component and test packages; follow the actual supported APIs.
7. Confirm a safe **local development database** and separate isolated test database, migration history and backup/recovery approach. No destructive migration without approval.
8. Run and record baseline typecheck, lint, format, unit/integration/E2E (where available) and build results before changes. Distinguish inherited failures from regressions.
9. Inspect current data sources for certification facts, sample questions, provider names, logo assets and licensing; do not assume sample datasets are authoritative or redistributable.
10. Determine the actual current highest numbered `feature/NNN-*` ref across local and remote branches. Resume an existing valid Phase 5 branch instead of creating a duplicate; otherwise create the next number from `origin/development` when safe.

**Entry gate:** Minor repairable integration defects may be resolved and documented. Stop for conflicting approved specifications, unsafe migrations, absent indispensable identity/access infrastructure, copyrighted-content licensing uncertainty for specific imports, or a Git state that cannot be safely preserved. A missing paid provider, production email or cloud service is **not** itself a blocker; use safe local substitutes and do not claim external integration.

---

## 3. Business scope, personas and vocabulary

### 3.1 Intended users

| Persona | Allowed Phase 5 activity | Required scope enforcement |
|---|---|---|
| Visitor | View published certification tracks and public exam overview | No unpublished content, restricted solutions or private learner data |
| Student | View entitled preparation tracks, plan studies, access mapped authorized lessons and practice formative items | Only their own plans, sessions and records; no entitlement bypass |
| Instructor/author | Maintain assigned track content and objective/lesson mappings subject to review | Cannot modify unassigned tracks, publish without permission or see unrelated student data |
| Content reviewer | Review proposed objective/question changes if assigned and authorized | Cannot self-approve when a separation-of-duties policy is configured |
| Administrator | Govern providers, exams, track status, content roles and audit events | Must satisfy Phase 2 privileged authorization and MFA requirements |

Use existing role semantics and assignments where possible; implement content-review privileges as permissions/assignments rather than inventing a new global identity role unless justified.

### 3.2 Concepts and relationships

- **Certification provider:** Organization that awards a credential (for example AWS, Microsoft, Google Cloud, CompTIA, Cisco). Provider names are identifiers, not endorsements.
- **Certification:** Credential or professional pathway, associated with a provider and a public display identity.
- **Exam version/blueprint:** Specific exam code/version and published objective structure; preserve historical versions for learner records.
- **Domain:** Weighted knowledge area within an exam blueprint; provider weights may be published ranges or unavailable.
- **Objective:** Fine-grained competence/topic mapped to a domain; may have hierarchy and source reference.
- **Preparation track:** Stack Varsity's learning offering for a defined exam version, with goals, prerequisites, mapped LMS resources and publication/access policy.
- **Objective mapping:** Explicit relation between exam objectives and eligible courses, lessons or curated resources.
- **Study-plan template:** A reviewable sequence of weekly/daily study activities and optional suggested pace.
- **Learner study plan:** Individual schedule/status derived from a template plus learner preferences; not a purchased subscription.
- **Formative item:** Original/licensed question used for practice and explanations outside formal exams.
- **Practice session:** Untimed or self-paced learning/check-for-understanding flow; not a formal examination attempt.
- **Coverage:** Evidence of encountering/studying mapped content, optionally including formative practice; **not** a validated probability of passing an external exam.

### 3.3 Provider integrity and fair use

- Certification names, exam codes and exam objectives should be sourced from official provider material where possible, with **source URL, retrieved date, exam version/effective date and verification status**.
- Provider specifications can change; do not hardcode unverified current prices, pass marks, exam length, number of questions or version-validity claims.
- Do not scrape or reproduce proprietary exam question banks, exam dumps, trademarked logos or copyrighted study guides without rights. Prefer **original questions** and summarize objective descriptions as needed.
- Clearly label Stack Varsity as an independent preparation provider unless a partnership or endorsement has been verified and approved.
- Do not guarantee exam success, certification awards, employment or salary outcomes.
- Respect provider trademark usage guidelines and attribution requirements when applicable.

---

## 4. Boundaries and cross-phase integration

| Capability | Phase 5 includes | Deferred or excluded |
|---|---|---|
| Provider catalogue | Provider and credential records, versioned exam details | External provider account integrations |
| Objectives | Sourced blueprint domains, hierarchy, optional weights and version change history | Automatically claiming official sync without verified integration |
| Track catalog | Published preparation tracks, SEO, eligibility and LMS mappings | Replacing Phase 3 public site architecture |
| Study planning | Templates, learner pacing, progress, backlog/reschedule | AI adaptive tutoring, calendar integrations by default |
| Learning access | Reuse Phase 4 course/enrollment entitlement rules | Paid entitlement creation or bypassing checkout |
| Practice | Original formative quizzes/items, feedback, rationale and review | Timed exams, exam engine, high-stakes grading, proctoring, pass/fail |
| Analytics | Learning coverage, practice activity, study-plan completion | Predictive pass probability or full business analytics |
| Content operations | Author/reviewer workflow, versioning, publication and audit | Complete enterprise content-management suite |
| Commercial | Preparation offerings can be marked free/paid descriptively | Checkout, subscriptions, refunds and invoices: Phase 7 |

**Phase boundary contract for Phase 6:** The formal exam engine may reference an approved question/content pool, but Phase 5's practice service must not become a partially hidden exam engine. Model shared question metadata only where justified, document versioning and licensing, and isolate exam-mode policies for Phase 6.

---

## 5. Information architecture and suggested routes

Existing routes and naming in the repository take priority. The following are candidates, not orders to create duplicate paths.

### 5.1 Public

```text
/certifications                           # Existing Phase 3 listing, now data-backed
/certifications/[slug]                    # Published certification details
/certifications/[slug]/objectives         # Public overview, where permitted
/certifications/[slug]/study-guide        # SEO-safe public orientation, not paid content
```

### 5.2 Authenticated learners

```text
/student/certifications                   # Learner preparation tracks
/student/certifications/[trackId]         # Track workspace / roadmap
/student/certifications/[trackId]/plan    # Personal study plan
/student/certifications/[trackId]/practice# Formative practice entry
/student/certifications/[trackId]/review  # Review and objective coverage
```

### 5.3 Staff

```text
/instructor/certifications                # Assigned tracks
/instructor/certifications/[trackId]      # Content editor, within scope
/admin/certifications                     # Governance and management
/admin/certifications/[trackId]           # Admin editorial workflow
```

Use App Router conventions and ensure URL route segments exist explicitly; parenthesized route groups do not appear in URLs. Avoid overlap with Phase 4 instructor/course routes and protected layout redirects. Server Actions and Route Handlers must independently authenticate/authorize; middleware/proxy redirects are only supplementary.

### 5.4 Module ownership (illustrative)

```text
src/
  app/                                   # Routes, layouts, metadata, interfaces
  modules/
    certifications/
      components/                         # UI owned by the certification domain
      schemas/                            # Zod input/domain validation
      services/                           # Domain rules, access checks
      repositories/                       # Server-only Prisma access
      permissions/                        # Resource authorization adapters
      types/                              # Stable internal and DTO types
      data/                               # Explicitly licensed local fixtures only
    courses/                              # Phase 4, referenced through public services
    enrollments/                          # Phase 4, entitlement source of truth
    learning/                             # Phase 4, progress source of truth
    examinations/                         # Phase 6, not implemented here
  server/                                 # DB, auditing, auth, shared server infrastructure
  lib/                                    # Pure shared helpers
prisma/                                   # Schema and additive migrations
scripts/                                  # Local verifiers, import/seed tooling
 tests/
    unit/
    integration/
    e2e/
docs/
  phase-5/
  architecture/
```

Do not build a large generic “shared certification platform” abstraction if the current app only needs a well-bounded certifications module. Use server-only imports for repositories; prefer service APIs over cross-module table writes.

---

## 6. Data model and integrity specification

The implementing agent must produce an ERD or equivalent schema narrative before migrating. Candidate conceptual entities (names to be reconciled with the actual Prisma schema):

| Entity | Minimum semantics | Integrity / security concern |
|---|---|---|
| CertificationProvider | name, slug, official homepage, verified/active status | Unique provider slug; approved external URLs |
| Certification | provider relation, credential name, slug, status | Stable canonical slug; avoid code/name ambiguity |
| ExamVersion | certification relation, exam code/version, effective dates, source evidence, archival state | Stable/versioned identity; never overwrite history |
| ExamDomain | version relation, title, optional weight/range, sort order | Uniqueness and valid ordering per exam version |
| ExamObjective | version/domain relation, objective key, title/summary, hierarchical parent, source | Stable objective keys; no orphan or circular hierarchy |
| PreparationTrack | exam version, slug, owner, published status, prerequisites, description, access policy | Explicit version binding, unique slug and publication gating |
| TrackCourseMap / TrackLessonMap | track-objective / course-lesson linkage | Reference integrity and authorization for mapped unpublished content |
| StudyPlanTemplate | track, duration, scheduled activity specification, version | Version templates instead of silently rewriting existing plans |
| LearnerPreparationEnrollment | user, track, status, entitlement source | Per-user uniqueness rules; no duplicate entitlements |
| LearnerStudyPlan | user, track, template version, start date, timezone, schedule state | Ownership, stable dates, reschedule logic |
| StudyTask | study plan, objective/activity, due date, completion | Idempotent completion, no unauthorized cross-user updates |
| PracticeQuestion | track/version/objective alignment, original content, answer specification, explanation, provenance, publication status | No leaked answers before response, provenance/licensing |
| PracticeAttempt / PracticeResponse | learner, item version, response, feedback timestamps | Immutable enough to audit; no cross-user data |
| ObjectiveCoverage | optional derived/cache aggregate | Never user-editable or falsely equated with readiness |
| CertificationAuditEvent | actor, action, scoped resource, timestamp, minimal metadata | No secrets/PII dumped into audit detail |

### 6.1 Schema rules

1. Prefer additive, reversible migrations; use reviewable changesets. Never reset the database or drop existing LMS data without explicit consent.
2. Use appropriate `onDelete` behavior. In particular, **archive/version** published exam blueprints, questions and track mappings rather than cascading away learner history.
3. Apply unique constraints for provider slugs, credential identities, exam codes within provider scope, objective keys within version, track slugs, per-user current plans and response idempotency where needed.
4. Use database transactions for publishing revisions, plan generation, responding/recording practice and entitlement changes that must be atomic.
5. Keep publicly visible question content separate from privileged answer/explanation access; do not send correct answers to the browser before a valid submission.
6. Define deterministic progress recalculation when objectives, linked lessons or study templates change. Preserve attempts against the item/version actually seen.
7. Use UTC timestamps in storage; calculate learner schedules using an explicit IANA timezone, defaulting only with documented fallback. Do not assume all learners share a local timezone.
8. Data imports and seeds must be idempotent, provenance-aware and prohibited from overwriting reviewed/published content silently.
9. Do not store exam-vendor account credentials or test-center personal data.
10. Separate official objective/source metadata from Stack Varsity-authored descriptions, course mappings and practice materials.

### 6.2 Study plans and coverage semantics

- The same plan template can lead to different user schedules; **template updates must not silently mutate active user plans**.
- Replanning preserves completed task history and includes a documented approach to overdue items.
- Duration/effort estimates are editorial guidance, not guaranteed times.
- Define an objective coverage formula before implementing UI. A simple default is `mapped eligible lessons completed / mapped eligible lessons` per objective; avoid dividing by zero and avoid treating a viewed page as mastery.
- Formative response performance may be shown independently as `correct responses / answered eligible items` with denominator and sample-size visibility. This is not official scoring and is not a certified pass probability.
- Weighted aggregate domain coverage may only use verified provider weights; if unknown or published as ranges, avoid false precision.

---

## 7. UX and content requirements

### 7.1 Public certification pages

- Show provider, credential name, exam code/version, date verified, target audience, prerequisites, learning domains, objectives overview and mapped preparation offering.
- Display **independent training provider** attribution and any required trademark disclaimers.
- Avoid unverifiable “official”, “guaranteed pass”, “2026 current” or provider-affiliation claims.
- Only published, reviewed tracks appear publicly. Drafts/retired editions must not leak through listing, sitemap, metadata or direct URL.
- Use approved brand system from Phase 1 and SEO conventions from Phase 3.

### 7.2 Student track workspace

- Responsive roadmap showing domains, objectives, mapped lessons and plan milestones.
- Clear distinction between “available”, “enrolled”, “locked”, “draft” and “retired”.
- Explain why access is unavailable without creating an unearned entitlement or fake checkout.
- Provide keyboard-accessible progress indicators and textual alternatives to color/graphs.
- Support empty, loading, failed, expired-session and no-content states.
- Study plan controls should be predictable and idempotent; avoid overwhelming users with options.

### 7.3 Formative practice experience

- Label as **Practice / Knowledge Check**, not an official vendor exam.
- Support an initial limited, maintainable question type, preferably single-choice; add multiple-choice/multi-select only if schemas, scoring, accessibility and tests support it.
- Provide a short explanation after submission, optional references and objective tags.
- Do not expose the answer key prematurely or permit unauthorized item harvesting.
- Provide a review of past responses and clear correction when an authored item is withdrawn or corrected.
- Avoid timers, pass/fail certificates, cheating/proctoring systems and formal exam-mode interfaces in this phase.

### 7.4 Editorial operations

- Reviewable creation/editing, ordering, preview and publication of tracks, objectives, mappings, study templates and original practice items.
- Explicit “outdated / needs re-verification” flags and last-reviewed metadata.
- Accessible editors with validation and preview; reject unsafe rich HTML, XSS payloads and unapproved embedded media.
- Author/reviewer assignment and audit of sensitive publication/retirement operations.

---

## 8. Security, privacy, reliability and compliance guardrails

1. **Authentication:** Reuse Phase 2 server-side Auth.js session and user retrieval; verify account status, MFA for privileged actions, and user permissions.
2. **Authorization:** Deny by default. Learner plans/practice responses are user-owned. Instructor authoring requires explicit assigned-track permissions; admin mutation requires privileged authorization.
3. **Entitlements:** Reuse Phase 4 authoritative enrollment/access services. Course access is not granted simply because a certification track was selected. A “paid” flag is not proof of payment.
4. **Data minimization:** Store only study progress and response data necessary for product functionality; no unnecessary vendor exam accounts or sensitive student profile fields.
5. **Privacy:** Learner practice outcomes and study schedules are private. Admin summaries should use aggregate, scoped data; do not expose individual results unnecessarily.
6. **Answer security:** Server owns validation and explanation release. Do not send hidden answer keys inside server-rendered public props or JSON before submission.
7. **Token and CSRF protections:** Follow existing server action/route handler protections. Validate Origin/Host where relevant and do not rely solely on browser controls.
8. **Input safety:** Zod schemas, strict length limits, safe URL protocols/hosts, sanitization of user-authored formatted content, and parameterized ORM queries.
9. **Rate limiting:** Protect practice submissions, content edits, search and public enumeration from abuse, using a production-appropriate abstraction (local-only in-memory is not a production guarantee).
10. **Auditability:** Log privileged content approval, publication, ownership and exam-version changes with minimal metadata and no secrets.
11. **Rights:** Do not import real vendor exam questions, unauthorized images, trademarks or study manuals without documented rights. Keep source/provenance data per question.
12. **Availability:** Handle stale/retired certification versions, deleted mappings, transient DB failures and concurrent plan updates gracefully.
13. **Accessibility:** WCAG 2.2 AA target; semantic controls, keyboard access, visible focus, error descriptions, screen-reader-friendly feedback.
14. **No false assurances:** “Readiness” indicators are educational heuristics only and must not claim external-exam approval or guaranteed pass likelihood.
15. **Local-first:** Do not silently require third-party AI, SaaS search or cloud hosting; use PostgreSQL-backed retrieval and local fixtures where reasonable.

---

## 9. Detailed Phase 5 implementation steps

**Every step ends with:** inspect diff → run relevant automated checks and quality gate → fix defects → update docs → commit step-specific changes → push the numbered **Phase 5 feature branch** → report outcome → **automatically continue** if no blocker. Never push a step directly to `development`.

### STEP 5.1 — Repository audit, scope reconciliation and feature branch

**Goal:** Establish a verified starting point and lock contracts with existing identity, public catalogue and LMS functionality.

**Tasks**
1. Complete Section 2 entry audit and establish baselines for status, dependencies, routes, schema, tests, branch protection and completion reports.
2. Compare the approved `docs/MASTER_PLAN.md` with this plan; create a concise deviation register rather than silently shifting scope.
3. Map the actual Phase 3 `/certifications` public pages and Phase 4 course/lesson/enrollment services to planned Phase 5 interfaces.
4. Decide which certification facts require external verification and which content is Stack Varsity-authored; record required attribution and copyright constraints.
5. Determine current highest `feature/NNN-*` number across local/remote; choose the next unused consecutive number; ensure no pre-existing valid Phase 5 branch should be resumed.
6. Safely branch from `origin/development`, verify remote, push the feature branch, and record branch/base commit.
7. Create `docs/phase-5/PHASE_5_SCOPE_AND_DEPENDENCIES.md` with interfaces, assumptions, deferred features and requirements traceability.

**Acceptance:** Clean or safely preserved workspace; numbered feature branch exists remotely; baseline test status recorded; no unresolved material conflict; module/route ownership and dependency contracts are documented.

**End step:** validate → commit `chore(certifications): audit phase 5 dependencies and scope` → push `origin/feature/NNN-phase-5-certification-preparation` → continue to 5.2.

### STEP 5.2 — Certification catalogue, blueprint and versioned database models

**Goal:** Establish durable, provenance-aware professional-certification data without breaking LMS records.

**Tasks**
1. Design ERD, Prisma entities, constraints, indexes and archive policies using Section 6.
2. Implement provider, credential, exam version, blueprint domain/objective, preparation track, track-course/lesson mapping and editorial status models.
3. Include source links, verification timestamps, source text provenance, version validity, lifecycle state and independent-provider disclaimer fields where appropriate.
4. Add migration fixtures using original or clearly licensed sample content only. Do not claim unverified real-world exam facts.
5. Design read contracts for published vs draft/retired content and maintain stable slugs.
6. Write Prisma migration, validation and isolated integration tests for uniqueness, referential integrity, version history and publication filtering.
7. Document schema and migration safety in `docs/phase-5/CERTIFICATION_DATA_MODEL.md`.

**Acceptance:** Non-destructive migration succeeds; blueprint versioning works; public queries never expose drafts; rollback/migration implications documented; tests pass.

**End step:** validate → commit `feat(certifications): add versioned certification catalogue schema` → push feature branch → continue to 5.3.

### STEP 5.3 — Certification domain services, RBAC and editorial lifecycle

**Goal:** Provide secure, testable domain services independent of UI and external vendor systems.

**Tasks**
1. Implement typed Zod schemas and server-only repository/services for catalogue, blueprint, objectives and track publication.
2. Reuse Phase 2 identity permissions and Phase 4 instructor assignments; require explicit rights for track edit, review, publish and retire.
3. Define draft → in-review → published → archived/retired workflow with safe status transitions and permitted exceptions.
4. Add optimistic concurrency or equivalent mechanism to avoid lost updates and accidental overwrites.
5. Enforce exact exam-version references for published tracks and deterministic ordering of domains/objectives.
6. Validate official-source links, external URL protocol, field lengths, weight bounds and objective hierarchy cycles.
7. Add audit events for privileged changes; write negative security tests (wrong instructor, disabled user, user-supplied role, direct API bypass).
8. Document `docs/phase-5/CERTIFICATION_SERVICE_CONTRACTS.md`.

**Acceptance:** Unauthorized mutations are rejected at service boundary, workflow transitions are consistent, conflicts surface safely and all service tests pass.

**End step:** validate → commit `feat(certifications): implement secure track and blueprint services` → push feature branch → continue to 5.4.

### STEP 5.4 — Public certification catalogue and detail-page integration

**Goal:** Upgrade existing Phase 3 certification discovery with authoritative, published database-backed tracks.

**Tasks**
1. Reuse Phase 3 routes/components for `/certifications` and detail URLs rather than duplicating pages.
2. Implement published-track listing, provider filters, level/area filters and stable pagination or simple browse behavior consistent with approved UX.
3. Show verified exam code/version, objective/domain overview, prerequisites, mapped learning coverage and last-reviewed date.
4. Keep retired/unpublished tracks out of public data, sitemaps, structured data, internal links and search results; handle canonical/redirect policy for retired versions.
5. Add clear provider independence and trademark notices; use only approved visual assets.
6. Distinguish available free learning from future paid access; CTA should authenticate or show availability without bypassing entitlements.
7. Add metadata, safe structured data, semantic headings, keyboard navigation, responsive states and missing-data fallbacks.
8. Test public visibility, URL slugs, empty/filter conditions, XSS resistance, SEO outputs and render performance.

**Acceptance:** Public route contracts remain stable; only approved tracks appear; no misleading endorsement or unsupported exam claims; SEO/accessibility tests pass.

**End step:** validate → commit `feat(certifications): integrate published track discovery pages` → push feature branch → continue to 5.5.

### STEP 5.5 — Exam objectives and LMS learning-path mapping

**Goal:** Connect professional-certification objectives to real Stack Varsity learning resources.

**Tasks**
1. Implement objective mapping to Phase 4 courses/sections/lessons through explicit service contracts; use course/lesson IDs from source-of-truth models.
2. Make map ordering, required/optional designation and objective coverage traceable and reviewable.
3. Show learner-friendly domain/objective outlines and linked lesson recommendations, respecting visibility and access.
4. Ensure a track map cannot make unpublished lessons public, grant a paid entitlement or expose another instructor's content.
5. Handle stale mappings when a course changes publication status or lessons are archived; surface staff revalidation tasks.
6. Add tests for cross-track associations, invalid records, duplicate mapping, unauthorized access and changes to source lessons.
7. Document objective-to-learning mapping contract and eventual Phase 6 exam blueprint references.

**Acceptance:** Every active mapping resolves to a permitted resource; learner links preserve LMS authorization; staff see stale/invalid mapping warnings.

**End step:** validate → commit `feat(certifications): map exam objectives to LMS resources` → push feature branch → continue to 5.6.

### STEP 5.6 — Track access and learner preparation workspace

**Goal:** Give authenticated learners a secure place to manage an authorized preparation track.

**Tasks**
1. Implement or reuse learner-to-track relationship and entitlement status model; do not create billing state or invented purchase claims.
2. Reuse Phase 4 enrollment/entitlement checks for every linked restricted course/lesson. A track join does not silently grant access to paid courses.
3. Provide a `/student/certifications` listing with current tracks, next activity, progress summary and unstarted/empty/error states.
4. Provide a responsive per-track roadmap showing domains, mapped lessons and plan status.
5. Handle retired versions predictably: retained historical progress, messaging and optional explicit migration to newer plans only when supported.
6. Protect all server queries and mutations with current session, ownership and account-status checks.
7. Add tests for anonymous/wrong-user/wrong-role access, duplicate joins, locked content and archived editions.

**Acceptance:** Student can view own track workspace; direct-object-reference attempts fail; restricted LMS content remains protected; accessibility checks pass.

**End step:** validate → commit `feat(certifications): add secure learner preparation workspace` → push feature branch → continue to 5.7.

### STEP 5.7 — Study-plan templates and personal study scheduler

**Goal:** Turn blueprint objectives and mapped lessons into actionable learner schedules.

**Tasks**
1. Implement versioned track study-plan templates with duration, milestones, ordered tasks and editorial estimates.
2. Add user plan generation from selected template, with start date, weekly commitment and explicit IANA timezone handling.
3. Support reschedule/restart/pause according to written rules that preserve completed tasks and do not duplicate work.
4. Show upcoming, due, completed and overdue activities with accessible interaction and clear status definitions.
5. Record tasks and completion server-side; use idempotent updates and prevent another learner from editing a plan.
6. Ensure progress reflects actual task completion, not arbitrary client-submitted percentages.
7. Add date-boundary/DST, concurrent-update, duplicate-request, invalid schedule and ownership tests.
8. Document schedule algorithms, template version behavior and decisions for stale certification versions.

**Acceptance:** Deterministic schedules; no duplicate plan tasks; completed history survives rescheduling; UI responsive; tests pass.

**End step:** validate → commit `feat(certifications): implement study plans and scheduling` → push feature branch → continue to 5.8.

### STEP 5.8 — Formative question authoring, provenance and review

**Goal:** Support legally appropriate, high-quality practice content for certification learning.

**Tasks**
1. Design practice-question and question-version models, answer choices, correct-answer rules, explanation, objective mapping, status and provenance.
2. Start with single-choice questions; add multi-select only with thorough scoring/test coverage. No official exam dumps or copied protected items.
3. Implement staff author/edit/preview/review/publish/retire workflow with access checks, content validation and safe rendering.
4. Require explanation, objective alignment, review status and content-origin/licensing marker before publication.
5. Avoid exposing correct answer data in public item-fetch responses; protect solutions on server until submission.
6. Persist historical version references for attempts so content fixes do not silently rewrite earlier learner feedback.
7. Add seed examples written originally for Stack Varsity and clearly label them illustrative, not vendor exam questions.
8. Test malicious content, invalid item structures, wrong-staff edits, unpublished answer leakage and duplicate/version transitions.

**Acceptance:** Valid original practice items can be published; provenance recorded; answer key cannot be fetched before answering; tests pass.

**End step:** validate → commit `feat(certifications): add reviewed formative question bank` → push feature branch → continue to 5.9.

### STEP 5.9 — Learner practice, feedback and review experience

**Goal:** Deliver secure, self-paced knowledge checks distinct from formal examinations.

**Tasks**
1. Build a learner practice flow scoped to the entitled track/objectives, with semantic radio controls, keyboard navigation and clear progress.
2. Select published questions through server-side services with eligibility/visibility checks. Use reasonable per-session size and rate limits.
3. Accept responses without trusting client-reported answer keys or scores; assess server-side and return explanation after valid submission.
4. Implement idempotent response submission and avoid duplicate attempts on retries or concurrent requests.
5. Provide review history and objective tagging; allow learners to revisit explanations appropriately.
6. Mark all interfaces **formative practice**; exclude timers, proctoring, certification claims and pass/fail reports.
7. Maintain accessible feedback for correct/incorrect and non-answerable/retired content states.
8. Test response forgery, cross-user sessions, unauthorized answer access, repeated submissions, disabled accounts and empty question sets.

**Acceptance:** Learner can complete a practice set, receive explanations after submitting and review responses; server owns correctness; security tests pass.

**End step:** validate → commit `feat(certifications): implement formative practice and feedback` → push feature branch → continue to 5.10.

### STEP 5.10 — Coverage insights, recommendations and content operations

**Goal:** Make learning activity actionable without overstating exam readiness; provide basic content governance.

**Tasks**
1. Define and implement objective/domain progress calculations based on mapped LMS lesson completion, study tasks and practice activity, keeping these signals distinct.
2. Show denominators, recent activity, low-coverage objectives and simple “what to study next” recommendations using explicit deterministic rules.
3. Do not convert completion or practice accuracy directly into external-exam pass probability or official readiness score.
4. Add track reviewer/admin indicators for blueprint freshness, missing mappings, questions needing review, retired exam versions and unpublished items.
5. Expose only authorized aggregate/scoped learning metrics; avoid unrestricted learner-level reporting or Phase 8 BI features.
6. Implement safe recalculation when mappings or blueprint versions change; handle zero denominators and small sample sizes.
7. Add tests for calculation accuracy, privacy, stale data, sorting, cache invalidation and incorrect permissions.
8. Document formulas and any intentionally deferred recommendation sophistication.

**Acceptance:** Coverage is reproducible and labeled accurately; useful next-action suggestions appear; private data stays scoped; tests pass.

**End step:** validate → commit `feat(certifications): add objective coverage and content governance` → push feature branch → continue to 5.11.

### STEP 5.11 — Accessibility, security, performance and resiliency hardening

**Goal:** Bring the certification-preparation experience to a defensible production-quality baseline.

**Tasks**
1. Review responsive layouts (small mobile to desktop), loading/empty/error states, keyboard navigation, focus order, labels, screen-reader announcements and contrast (WCAG 2.2 AA target).
2. Audit server-only boundaries, auth/RBAC/MFA, IDOR, answer-key leaks, form/request abuse, XSS, malicious URLs and injection defenses.
3. Review database query plans, indexes, list pagination, N+1 read patterns and route caching behavior; prevent private response caching.
4. Add realistic local tests for concurrent plan updates, transient database failures, session expiration and stale blueprint references.
5. Verify licensing/source disclaimers and show exam version freshness appropriately.
6. Add automated accessibility and security regression tests where practical; document manual review results separately.
7. Review dependency advisories without blind force upgrades; measure observable page/query performance against locally recorded baselines.
8. Document remaining limitations, risk owners and remediation steps.

**Acceptance:** No known critical/high authorization or content-security defects; major learner and staff flows accessible; relevant performance regressions fixed; checks pass.

**End step:** validate → commit `fix(certifications): harden preparation security accessibility and performance` → push feature branch → continue to 5.12.

### STEP 5.12 — Integration QA, documentation and manual PR handoff

**Goal:** Validate Phase 5 end to end and provide a review-ready feature branch and complete handoff.

**Tasks**
1. Run all applicable typecheck, lint, format, unit, integration, E2E, Prisma validation/migration-status and production-build checks. Record actual results and blockers.
2. Run learner E2E: discover published track → authenticate → enter entitled workspace → follow mapped lesson → create/complete plan task → answer formative item → view rationale and coverage.
3. Run staff E2E: create draft blueprint → map authorized LMS content → author original question → review/publish → verify public visibility → retire version safely.
4. Run negative authorization checks for anonymous users, unrelated students, unassigned instructors, disabled users and privileged MFA requirements.
5. Verify Phase 3 search/metadata/sitemap and Phase 4 course/enrollment/progress behavior remain intact.
6. Verify migrations are additive and reviewed, secrets excluded, source provenance present, no copyrighted vendor exam items imported, and no invented exam-provider endorsement.
7. Produce `docs/phase-5/PHASE_5_COMPLETION_REPORT.md` with features, architecture, version list, migration IDs, route inventory, UX evidence, test commands and actual results, risks, non-goals and readiness decision.
8. Create or update `docs/phase-5/PHASE_5_PR_SUMMARY.md` with a ready-to-paste PR title/body and reviewer checklist. Open a PR **to `development`** only if GitHub CLI/API access is legitimately configured; otherwise provide manual instructions. Do not merge.
9. Confirm one focused commit/push exists for every successfully completed step, no unexpected staged/untracked secrets remain, and feature branch points at the validated work.
10. Give PASS, CONDITIONAL PASS or FAIL with evidence. No PASS with unresolved critical/high security findings or unexecuted essential flows.

**Acceptance:** Documented, reviewable, secure Phase 5 implementation on the feature branch; actual validation evidence; PR summary ready; owner retains all merge/promotion control.

**End step:** validate → commit `chore(certifications): complete phase 5 quality gate and handoff` → push feature branch → create/update PR or prepare manual PR summary targeting `development` → **STOP**. Never begin Phase 6 automatically.

---

## 10. Mandatory autonomous agent protocol

### 10.1 Branch numbering and ownership

1. Use `development` as the integration **base**, not a direct commit/push target.
2. Inspect all local/remote `feature/NNN-*` refs; use the next consecutive unused **three-digit** number (`feature/014-...` only if `013` is highest). **Do not derive branch numbers from phase numbers or previous examples.**
3. If a legitimate Phase 5 feature branch already exists, verify it and resume rather than creating a second branch.
4. Branch from up-to-date `origin/development` when the working tree is safe. Never force-push, hard-reset, silently delete user files or rewrite published history.
5. Commit and push after **each completed step** to the same Phase 5 feature branch. PRs are optional per step; prefer a single Phase 5 PR into `development` at the end.
6. Never auto-merge a PR or push/merge to `development`, `Staging-I`, `Staging-II` or `main`.
7. The owner alone promotes `development` → `Staging-I` → `Staging-II` → `main`. These are Git branches, not implied deployment environments.

### 10.2 Safe startup commands (PowerShell example; inspect first)

```powershell
git status --short
git branch --show-current
git remote -v
git fetch origin --prune
git branch -a
# Determine highest NNN across local + remote feature/NNN-* refs.
# Resume existing Phase 5 branch if appropriate.
# Only with safe working tree and correct refs:
git switch development
git pull --ff-only origin development
git switch -c feature/NNN-phase-5-certification-preparation
git push -u origin feature/NNN-phase-5-certification-preparation
```

Substitute the *actual* verified branch number. A dirty working tree, non-fast-forward integration ref or questionable remote should be resolved safely or treated as a blocker; never discard work to keep moving.

### 10.3 Every-step lifecycle

**Audit current state → implement focused change → write tests → run relevant checks → fix regression → inspect security/UX → update docs → inspect staged diff → commit → push → record SHA and results → next step automatically.**

The agent is authorized to progress from 5.1 to 5.12 without waiting for confirmations when all quality and safety requirements are met. Do not ask routine engineering questions; make documented, reversible decisions where reasonable.

**Stop and request owner input only for:** material master-plan conflict, irreversible/destructive migration, uncertain rights to import a specific third-party question bank, missing indispensable credential with no safe local fallback, unsafe Git history changes, severe security failure not safely repairable, or a business policy requiring approval. Nonblocking limitations must be documented and should not stop progress.

### 10.4 Quality gate commands (use actual scripts)

```powershell
npm run typecheck
npm run lint
npm run format:check
npm run test:unit
npm run test:integration
npm run test:e2e
npm run build
```

Also run Prisma schema validation/migration status, isolated DB integration tests, route/HTTP smoke tests and applicable accessibility checks. Only invoke commands that exist in the current project; adapt to actual scripts and versions. Never claim unrun checks passed, and never disable security validation to create a green report. `npm audit fix --force` is prohibited without specific owner authorization.

### 10.5 Safe Git commit/push workflow

```powershell
git status --short
git diff --check
git diff
# Stage task-specific files only; review carefully.
git add <specific-files-or-directories>
git diff --cached --check
git diff --cached
git commit -m "feat(certifications): <step-specific-purpose>"
git push origin feature/NNN-phase-5-certification-preparation
```

Verify remote and branch before every push. Never include `.env` secrets, tokens, real student records, proprietary exam content, database dumps, large media, local mail captures or build artifacts. Record the commit SHA and push result in the step log.

### 10.6 Required step report

```text
Phase 5 — Step 5.X: <step title>
Status: PASS | BLOCKED | FAIL
Branch: feature/NNN-phase-5-certification-preparation
Commit: <actual SHA or none>
Push: <actual remote ref/result>
Files/modules changed: <summary>
Schema/migrations: <IDs/results or none>
Tests/checks: <exact commands and actual results>
Auth/privacy/content-rights: <review outcome>
Open issues: <nonblocking or blocking>
Next: Step 5.(X+1) automatically | STOP (reason)
```

Store durable results in `docs/phase-5/PHASE_5_IMPLEMENTATION_LOG.md` or equivalent. When no external tool or network access is available to push or open a PR, never invent success; report the limitation, preserve local changes, and supply exact manual commands. Under the required step-push workflow, inability to push is a blocker for auto-progression unless explicitly waived by the owner.

### 10.7 Manual PR and promotion workflow

```text
feature/NNN-phase-5-certification-preparation
                |
                | PR (prepared/opened by agent; NEVER auto-merged)
                v
           development              <- OWNER manually merges
                |
                v
             Staging-I               <- OWNER manually promotes
                |
                v
             Staging-II              <- OWNER manually promotes
                |
                v
                main                 <- OWNER manually promotes
```

A Phase 5 PR should be against `development` only. Do not merge it. Do not open PRs automatically against staging or main.

---

## 11. Authorization, integration and test matrix

### 11.1 Authorization matrix

| Test scenario | Visitor | Unentitled student | Entitled student | Assigned author | Unassigned author | Admin with required MFA |
|---|---|---|---|---|---|---|
| View published public track | Allow | Allow | Allow | Allow | Allow | Allow |
| View draft track | Deny | Deny | Deny | Assigned preview if authorized | Deny | Allow |
| View own study plan | Deny | Only if own valid plan | Allow | Only if personal/own | Only if personal/own | Restricted by admin policy |
| Edit another learner's plan | Deny | Deny | Deny | Deny | Deny | Deny by default |
| Access mapped restricted lesson | Deny | Deny | Only with LMS entitlement | Only with legitimate preview/access | Deny absent rights | Authorized preview only |
| Submit own formative answer | Deny | Only when track policy permits | Allow | As student with entitlement | As student with entitlement | Not exempt from session/ownership policy |
| Read other learner's answers | Deny | Deny | Deny | Deny by default | Deny | Only specifically audited support case if policy permits |
| Edit track objectives | Deny | Deny | Deny | Assigned rights | Deny | Allow |
| Publish/retire track | Deny | Deny | Deny | Only explicit publisher privilege | Deny | Allow |
| Change exam provenance/source | Deny | Deny | Deny | Assigned rights with audit | Deny | Allow |

Where actual permissions differ in approved repository policy, document and implement the tighter compatible policy. Account status and MFA enforcement always apply.

### 11.2 Must-pass negative tests

- Anonymous or student calls to staff mutation Server Actions/Route Handlers.
- Student A requesting Student B's study-plan IDs or response IDs (IDOR).
- Assigned instructor A editing unassigned track B.
- Direct browser/API access to draft/retired certification routes, answers and provider source fields.
- Track selection that inadvertently unlocks a paid or unenrolled LMS lesson.
- Attempt to submit a correct answer or computed coverage score directly as trusted client metadata.
- Response-key harvesting before question submission.
- Replay of formative-answer requests and concurrent submission/plan-completion race conditions.
- Invalid blueprint objective links, stale exam-version mappings and deleted lesson references.
- Script injection through objectives, rationales, imported Markdown/HTML or reference URLs.
- Disabled/suspended user retaining protected access.
- Admin content mutation without the Phase 2 required MFA elevation.
- Unauthorized bulk question import, copied vendor exam dumps or provenance bypass.
- Caching of private per-user study plans or formative responses in public/CDN storage.

### 11.3 Required test layers

**Unit tests:** Status transitions, blueprint validation, objective ordering, plan schedule generation, progress denominators, eligibility and response evaluation.

**Integration tests:** Prisma relations, unique constraints, transactional idempotency, migration safety, publication filtering, entitlement links, audit events and isolated database state.

**Component tests:** Public filters, objective lists, empty states, accessible forms, study-plan controls, practice question feedback, error messaging.

**E2E tests:** Full learner and staff journeys and principal denial cases. Keep official exam data, production users and secret tokens out of fixtures.

**Accessibility checks:** Keyboard-only paths, screen-reader labels, error descriptions, contrast, reduced motion, responsive navigation and focus behavior.

**Performance checks:** Public listing/detail queries, roadmap and plan generation for realistic data volumes, practice-response latency, no N+1 queries, no secret/private cache leakage.

---

## 12. Definition of Done — Phase 5

Every criterion must be explicitly PASS, FAIL or BLOCKED with evidence.

### Functional

- [ ] Versioned provider/certification/exam-objective catalogue functions.
- [ ] Public track listings and detail pages show only approved published editions.
- [ ] Objective mappings resolve to authorized Phase 4 lessons and courses.
- [ ] Learners can access their own valid preparation track workspace.
- [ ] Study plans can be generated, completed and rescheduled without lost history.
- [ ] Original/reviewed formative items can be authored, published and retired.
- [ ] Self-paced practice returns explanations after server-side response submission.
- [ ] Objective/domain coverage indicators are transparent and avoid false pass claims.
- [ ] Authorized staff can maintain content without bypassing review/audit rules.
- [ ] Phase 3 SEO and Phase 4 LMS core flows continue working.

### Technical, security and reliability

- [ ] Additive Prisma migrations reviewed and applied to designated development DB.
- [ ] Unit, integration and E2E tests pass or documented blocking exceptions resolved.
- [ ] TypeScript, lint, format and production build pass.
- [ ] Authorization tests for IDOR and wrong-role/assignment access pass.
- [ ] Answer keys are not exposed prior to valid response.
- [ ] User/private responses are not cached or publicly exposed.
- [ ] Certification content provenance, vendor independence and licensing rules documented.
- [ ] No unresolved critical/high-severity security findings.
- [ ] Accessibility and responsive review completed with recorded evidence.
- [ ] No payment-flow, full exam-engine or production deployment scope leakage.

### Git and handoff

- [ ] Next unused consecutively numbered Phase 5 feature branch created/resumed safely.
- [ ] Each completed step has a reviewed commit and successful push on the feature branch.
- [ ] Final completion report and PR summary are in the repository.
- [ ] PR source is Phase 5 feature branch; PR base is `development`.
- [ ] PR is prepared/opened without automatic merge.
- [ ] No direct agent merges/pushes to `development`, `Staging-I`, `Staging-II`, or `main`.
- [ ] Owner receives exact instructions for manual review and promotion.

**Readiness outcome:** **PASS** = requirements met and no release-blocking defects; **CONDITIONAL PASS** = only documented nonblocking limitations; **FAIL** = broken core flow, authorization gap, unreviewed destructive migration, unresolved licensing issue for shipped content, or critical/high security finding. Do not equate CONDITIONAL PASS with permission for production deployment.

---

## 13. Reusable single-message AI coding-agent execution prompt

Copy the following prompt into the coding agent with repository access:

> You are the Principal Engineer, Next.js Modular Monolith Architect, PostgreSQL/Prisma Engineer, IAM Security Engineer, Instructional Product Designer and QA Lead for **Stack Varsity V1**.
>
> Implement **Phase 5 — Professional Certification Preparation** using `docs/phase-5/PHASE_5_MASTER_PLAN.md` as the detailed execution contract and reconcile it against the repository's current `docs/MASTER_PLAN.md`, Phases 1–4 implementations and installed package versions. Preserve the existing Next.js App Router modular monolith and never add a separate Express backend or new monorepo.
>
> First audit Git, the latest `origin/development`, active roles/auth/MFA, course and enrollment entitlements, Phase 3 certification routes, LMS lesson/progress services, database migrations, testing tools and existing content rights. Identify all `feature/NNN-*` branches locally/remotely. Resume the valid Phase 5 branch if it exists, otherwise create and push the **next consecutive numbered** `feature/NNN-phase-5-certification-preparation` branch from a safe base. Do not assume a number or overwrite user changes.
>
> Execute Steps **5.1 through 5.12 sequentially**. After each step: implement only the step scope; add tests; run relevant typecheck, ESLint, format, unit/integration/E2E and build checks; fix defects; check auth/resource scope, content provenance and migration safety; update documentation; inspect staged diff; **commit and push the Phase 5 feature branch**; write a concise outcome report and immediately continue. Ask no routine confirmation. Stop only for a genuine blocker, material specification conflict, destructive operation, indispensable missing input or unresolved severe security issue. Never claim tests, pushes or PRs succeeded without tool evidence.
>
> The phase must deliver versioned certification providers/exam blueprints and objectives, approved learning mappings to Phase 4, published public tracks, entitled learner workspaces, study plans, original and licensed **formative** practice, explanations, objective coverage and editorial governance. Explicitly **exclude Phase 6's formal timed exam engine and Phase 7's payments**. Never import proprietary vendor exam dumps or make unsupported exam-pass guarantees or official endorsement claims.
>
> For Git, **never merge** or push directly to `development`, `Staging-I`, `Staging-II` or `main`. A single final PR may be opened with **source = Phase 5 feature branch; target = `development`**, but only the owner merges it. The owner later manually promotes `development` → `Staging-I` → `Staging-II` → `main`. If PR tooling is unavailable, create a ready-to-paste PR description and show manual creation commands. Do not create duplicate PRs.
>
> At Step 5.12, produce `docs/phase-5/PHASE_5_COMPLETION_REPORT.md` and `docs/phase-5/PHASE_5_PR_SUMMARY.md`, record actual validation outcomes, commit and push them, prepare/open the PR into `development` and **STOP**. Never begin Phase 6 automatically.

---

## 14. Step execution summary

| Step | Scope | Mandatory end condition |
|---|---|---|
| 5.1 | Audit, dependency map, numbered branch | Validate → commit → push → continue |
| 5.2 | Versioned certification data model | Validate migration/tests → commit → push → continue |
| 5.3 | Secure domain services/editorial workflow | Security tests → commit → push → continue |
| 5.4 | Public certification discovery integration | SEO/accessibility tests → commit → push → continue |
| 5.5 | Objective ↔ LMS learning mapping | Entitlement tests → commit → push → continue |
| 5.6 | Learner certification workspace | Ownership tests → commit → push → continue |
| 5.7 | Study plans and scheduling | Schedule/idempotency tests → commit → push → continue |
| 5.8 | Original formative item authoring | Rights/answer-leak tests → commit → push → continue |
| 5.9 | Formative practice and feedback | Response/IDOR tests → commit → push → continue |
| 5.10 | Coverage and governance | Accuracy/privacy tests → commit → push → continue |
| 5.11 | Hardening | A11y/security/performance gate → commit → push → continue |
| 5.12 | Final QA and documentation | Gate → commit → push → PR to `development` → STOP |

---

## 15. Phase 5 PR package — manual review and merge

**Suggested PR title:** `feat(certifications): Phase 5 professional certification preparation`

**Source:** `feature/NNN-phase-5-certification-preparation` (replace NNN)  
**Base/target:** `development`  
**Merge authority:** Repository owner only

### Ready-to-paste PR description

```markdown
## Summary
Implements Phase 5 of Stack Varsity V1: professional certification preparation on the existing Next.js modular monolith.

## Source and target
- Source: `feature/NNN-phase-5-certification-preparation`
- Target: `development`
- Staging-I / Staging-II / main promotions: owner-controlled, manual only

## Features delivered
- [ ] Versioned certification provider / credential / blueprint / objective models
- [ ] Reviewable track editorial lifecycle and secure authoring
- [ ] Database-backed published certification discovery
- [ ] Objective mappings to existing authorized LMS lessons
- [ ] Learner track workspace and entitlement checks
- [ ] Personal study-plan templates, generation and progress
- [ ] Original/reviewed formative practice items and response feedback
- [ ] Objective/domain learning coverage and governance
- [ ] Accessibility, security and performance improvements

## Database changes
- Migration IDs: <actual IDs>
- Additive/destructive assessment: <actual result>
- Verification against isolated test DB: <actual outcome>

## Tests and build (actual results only)
| Check | Command | Result |
|---|---|---|
| TypeScript | <actual command> | PASS/FAIL/BLOCKED |
| ESLint | <actual command> | PASS/FAIL/BLOCKED |
| Prettier | <actual command> | PASS/FAIL/BLOCKED |
| Unit tests | <actual command> | PASS/FAIL/BLOCKED |
| Integration tests | <actual command> | PASS/FAIL/BLOCKED |
| E2E tests | <actual command> | PASS/FAIL/BLOCKED |
| Prisma/migrations | <actual command> | PASS/FAIL/BLOCKED |
| Production build | <actual command> | PASS/FAIL/BLOCKED |

## Security and content rights
- [ ] RBAC/resource ownership negative tests pass
- [ ] No public/early exposure of practice answer keys
- [ ] No bypass of LMS entitlements or payment policy
- [ ] Content is original/licensed with provenance
- [ ] No implied official certification-provider endorsement
- [ ] No unresolved critical/high findings

## Review notes and limitations
<list real findings; do not invent success>

## Reviewer checklist
- [ ] Compare implementation with `docs/MASTER_PLAN.md` and Phase 5 plan
- [ ] Inspect Prisma migration and data preservation
- [ ] Review provider version/source/trademark usage
- [ ] Test student practice and study plan ownership boundaries
- [ ] Verify public route SEO and existing LMS integration
- [ ] Review coverage formula / educational disclaimers
- [ ] Inspect build/test artifacts and completion report
- [ ] Manually approve and merge to `development` only when satisfied

## Documentation
- `docs/phase-5/PHASE_5_COMPLETION_REPORT.md`
- `docs/phase-5/PHASE_5_PR_SUMMARY.md`
- Additional phase-specific architecture and testing documentation
```

### Owner manual PR options

When authenticated GitHub CLI is available, the owner/agent may use:

```powershell
gh pr create --base development --head feature/NNN-phase-5-certification-preparation --title "feat(certifications): Phase 5 professional certification preparation" --body-file docs/phase-5/PHASE_5_PR_SUMMARY.md
```

Use the web GitHub **Compare & pull request** screen if CLI integration is unavailable. Do not invent a PR URL. Check whether an open PR already exists first to avoid duplicates.

### Suggested review commands

```powershell
git fetch origin --prune
git log --oneline origin/development..origin/feature/NNN-phase-5-certification-preparation
git diff --stat origin/development...origin/feature/NNN-phase-5-certification-preparation
git diff --check origin/development...origin/feature/NNN-phase-5-certification-preparation
```

These commands are inspection only. The owner chooses when to merge and promote to the staging and main branches.

---

## 16. Handoff to Phase 6 and later phases

### Phase 6 — Examination and Assessment Engine

Phase 5 should hand off approved exam-version/domain/objective identifiers, audited practice question metadata where appropriate, and reusable authorization/provenance conventions. Phase 6 must explicitly design formal attempts, timed sessions, grading/scoring, attempt limits, passing rules, result integrity, accommodations and security. **Do not assume Phase 5 formative responses are formal exam attempts.**

### Phase 7 — Payments and Subscriptions

Preparation tracks may carry display metadata for free/paid options, but only Phase 7 should implement checkout, verified Paystack webhook receipts, paid entitlements, refunds and subscription lifecycles. Never grant paid access from a client-side success page.

### Phase 8 — Administration and Reporting

Phase 5 supplies track content governance and basic scoped analytics. Phase 8 may add organization-wide moderation, dashboards, business KPIs and operational reporting with appropriate privacy controls.

### Phase 9–10 — Hardening and Launch

Release readiness will include deeper operational security, load/performance exercises, backups, observability, deployment configuration and prelaunch acceptance. Phase 5 should not independently deploy production services.

---

## 17. Final agent instruction

**Implement Phase 5 Steps 5.1–5.12 in order.** Create/resume the next consecutively numbered feature branch from the approved integration base; **validate, commit and push every completed step to that feature branch**; automatically proceed unless a genuine blocker requires owner input. At completion, create or prepare a thorough PR description from the feature branch into **`development` only**, do not merge, produce the phase completion report, and **STOP**. The repository owner alone manually merges and promotes through `Staging-I`, `Staging-II` and `main`.
