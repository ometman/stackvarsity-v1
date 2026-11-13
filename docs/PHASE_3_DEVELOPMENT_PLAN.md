# STACK VARSITY V1 — PHASE 3 MASTER DEVELOPMENT PLAN

**Phase:** 3 — Public Website & Discovery Experience  
**Project:** Stack Varsity V1  
**Brand:** Stack Varsity — _Build • Educate • Innovate_  
**Domain:** https://www.mystackvarsity.com  
**Contact:** hello@mystackvarsity.com  
**Repository:** https://github.com/ometman/stackvarsity-v1.git  
**Integration target:** `development` (manual PR merge)  
**Working branch:** consecutively numbered `feature/NNN-phase-3-public-website`  
**Promotion branches:** `Staging-I`, `Staging-II`, `main` (all merges controlled manually by the repository owner)  
**Architecture:** Next.js App Router modular monolith; PostgreSQL + Prisma; TypeScript  
**Execution style:** Local-first, incremental, agent-assisted, validation-driven

> **Source alignment note.** This plan follows the confirmed phase sequence (Phase 3 = Public Website), the architecture and execution rules agreed in this project, and the Phase 2 identity/access foundation. The actual current `docs/MASTER_PLAN.md` and repository were not provided with this request, so the implementing agent **must inspect them first** and reconcile any detailed differences without silently overriding an approved requirement. No claim is made that repository files or Phase 2 features have already been verified.

---

## 1. Executive summary

Phase 3 delivers Stack Varsity's professional, mobile-first public-facing website for prospective students and certification candidates. It establishes trust, explains the company's value proposition, presents educational offerings, allows visitors to discover courses and exam-preparation tracks, and moves prospective learners toward secure sign-up/enrollment entry points. It includes content, UX, metadata, technical SEO, accessibility, analytics readiness, and strong quality gates.

**North-star outcome:** A visitor can discover Stack Varsity, understand what it teaches, explore available learning paths and certification preparation, see accurate details, and proceed confidently to registration or a future enrollment workflow—with fast, accessible pages and no misleading promises.

**Phase boundaries:** Phase 3 creates public pages and read-only discovery surfaces. It must not prematurely implement LMS lessons, exam-taking/scoring, payments/subscriptions, or an extensive CMS. If Phase 2 is not complete, authenticated navigation must integrate with whatever actually exists, without faking authentication. If course records are not available yet, use an explicitly labeled, typed content source designed for replacement in Phase 4; never fabricate real instructors, certifications, accreditations, testimonials, fees, pass rates, or student outcomes.

---

## 2. Dependencies and entry criteria

Before implementation, the agent must:

1. Confirm a clean working tree and inspect `git status`, current branch, remotes, recent commits, all local/remote feature branch numbers, and existing PRs. Fetch remote refs and create or resume the consecutively numbered Phase 3 feature branch from the latest `origin/development`. Do not implement Phase 3 directly on `development`.
2. Read `docs/MASTER_PLAN.md`, applicable architecture/design/coding/testing documents, and Phase 1/2 completion reports **if present**.
3. Inventory `src/app`, `src/components`, `src/modules`, design tokens, Auth.js session helpers, Prisma models, tests, middleware/proxy conventions, environment variables, SEO config, and current assets.
4. Run existing typecheck, lint, formatting check, tests, and build to record **baseline** results; distinguish inherited failures from newly introduced issues.
5. Check whether approved logo, colors, fonts, copy, imagery, curriculum, prices, instructor identities, legal policies, and contact channels are supplied. Missing nonessential assets may use transparent placeholders or clearly marked draft copy. Do not invent claims or publish placeholder content as verified business facts.
6. Resolve route collisions and confirm exact installed Next.js APIs rather than relying on old examples.

**Do not reset the database, discard uncommitted changes, alter `main`, leak secrets, or install unnecessary frameworks.** Stop if a destructive operation or sensitive real-world action requires explicit approval.

### Acceptance at entry

- Existing site starts locally, or a baseline blocker is recorded with concrete evidence.
- Phase 2 login/registration paths are confirmed from code; links point only to implemented routes.
- The approved brand/logo and key content sources are identified, or their absence is recorded.

---

## 3. Business and audience context

**Primary proposition:** Practical digital-skills education and preparation for professional exams. Priority topic families may include AI, cloud computing, web development, IT/cybersecurity, and certification preparation; the actual catalog must reflect verified offerings and approved copy.

**Primary audiences:** Beginners and career changers, university/college students, professionals upskilling, and certification candidates in Ghana and beyond. Build localized relevance without excluding international visitors. Default language English; plan for future localization without introducing a multilingual framework prematurely.

**Primary user journeys:**

- Visitor → Home → Explore Courses → Course Detail → Register / Sign In.
- Visitor → Certification Prep → Track Detail → Register / Join waitlist (only if a real consent-capable workflow exists).
- Visitor → About / Why Stack Varsity → Contact / FAQ.
- Existing learner → Sign in → appropriate protected destination (subject to Phase 2 behavior).

**Business success metrics (instrumentation-ready, not invented targets):** qualified course-detail views, register CTA clicks, successful registration handoffs, contact submissions, organic landing-page impressions (post-launch), non-branded discovery, mobile conversion, and accessibility/performance health. Establish baseline before setting numerical targets.

---

## 4. Information architecture and page requirements

Use Next.js App Router under `(marketing)` route groups; group folder names do not affect URLs. Preserve existing `/` and avoid duplicate routes: move or adapt `src/app/page.tsx` carefully if using `(marketing)/page.tsx`.

| Page                         | Path (proposed)          | Purpose and minimum requirements                                                                                                                                         |
| ---------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Home                         | `/`                      | Hero/value proposition, education offerings, learning benefits, certification pathway, trust section with verifiable claims, primary/secondary CTAs, FAQ preview.        |
| Courses catalog              | `/courses`               | Search, category/level filters, accessible empty states, responsive cards, pagination or suitable query handling, verified availability labels.                          |
| Course detail                | `/courses/[slug]`        | Title, summary, outcomes, intended audience, prerequisites, syllabus/outline if approved, modality, duration/price only when accurate, CTAs, metadata, 404/unknown slug. |
| Certification prep directory | `/certifications`        | Categorized certification tracks; clear distinction between Stack Varsity preparation and third-party certification issuers.                                             |
| Certification track detail   | `/certifications/[slug]` | Overview, prerequisite guidance, learning focus, exam-body disclaimers where necessary, readiness CTA, correct canonical/meta.                                           |
| About                        | `/about`                 | Mission, values, teaching approach, verified company facts, brand story.                                                                                                 |
| How it works                 | `/how-it-works`          | Discover → Learn → Practice → Prepare; accurately describe only live experiences, otherwise label as coming soon.                                                        |
| Contact                      | `/contact`               | Verified email, accessible inquiry form or email alternative, server validation, consent notice, anti-abuse checks, successful/error states.                             |
| FAQ                          | `/faq`                   | Clear categories and evidence-based answers; disclosure-style interaction accessible by keyboard.                                                                        |
| Privacy policy               | `/privacy`               | **Approved legal text only**; provide review-ready template separately if needed, not pretend legal approval.                                                            |
| Terms                        | `/terms`                 | **Approved legal text only**; avoid publishing invented terms.                                                                                                           |
| Not found / error/loading    | App Router files         | Branded but accessible error, not-found, and loading states where appropriate.                                                                                           |

Optional pages **only with verified need/content**: `/blog`, `/resources`, `/instructors`, `/pricing`, `/success-stories`, `/events`. Do **not** build a full editorial CMS in Phase 3 without approval.

### Content inventory requirements

For each public page, store a content specification: audience, objective, heading hierarchy, approved content source, CTA, metadata, legal/trust review status, and freshness owner. Avoid lorem ipsum in final release-facing pages. Do not claim recognition, accreditation, guaranteed jobs, guaranteed exam passes, official AWS/Microsoft/Google partnerships, or testimonials without approval and evidence.

---

## 5. Architecture and implementation conventions

Recommended structure (adapt to existing repository; don't recreate directories already present):

```text
src/
  app/
    (marketing)/
      layout.tsx
      page.tsx
      courses/page.tsx
      courses/[slug]/page.tsx
      certifications/page.tsx
      certifications/[slug]/page.tsx
      about/page.tsx
      how-it-works/page.tsx
      contact/page.tsx
      faq/page.tsx
      privacy/page.tsx
      terms/page.tsx
    sitemap.ts
    robots.ts
    opengraph-image.tsx           # optional when appropriate
    not-found.tsx
  components/
    layout/                        # header, nav, footer, mobile menu
    shared/                        # reusable UI states, section headers
  modules/
    catalog/
      schemas/
      services/
      repositories/
      types/
      components/
    certification/
      schemas/
      services/
      types/
      components/
    contact/
      schemas/
      services/
      components/
  config/
    site.ts
    navigation.ts
  lib/
    seo/
  server/
    email/                        # reuse existing Phase 2 email service
    security/                     # reuse existing protection utilities
public/
  images/
docs/
  phase-3/
    CONTENT_INVENTORY.md
    ROUTE_MAP.md
    SEO_CHECKLIST.md
    ACCESSIBILITY_CHECKLIST.md
    PHASE_3_COMPLETION_REPORT.md
```

**Module boundaries:** route components compose views; modules own domain-level read contracts and validation; server-only repositories own data access; Client Components are used only for required interactions. Reuse Phase 1 shadcn/ui/tokens and Phase 2 auth/email infrastructure. Use server-side rendering/static generation according to content freshness and caching needs; do not expose Prisma/secrets in Client Components.

**Data sources:** If Phase 4 schema/content is not implemented, create a strongly typed, explicitly labeled provisional catalog dataset with stable slugs and realistic but clearly noncommercial examples. It must not misrepresent active purchasing, accreditation, fees, availability, or learning outcomes. Build a replaceable interface for migration to Prisma later; avoid committing a fake database schema only for display.

---

## 6. Design and experience standards

- Retain approved Stack Varsity logo, brand tokens, typography, and tagline. Do not invent a final brand identity when inputs are missing.
- Mobile-first, responsive layouts; test common 360px, 390px, 768px, 1024px, 1440px widths without horizontal overflow.
- Semantic landmarks, one logical H1 per page, descriptive links, skip-to-content, accessible nav disclosure, focus management, keyboard support, visible focus, sufficient contrast, reduced motion.
- Clear empty/loading/error/not-found states; accessible validation and announcements for forms.
- Meaningful imagery with alt text; decorative assets with empty alt; optimize with `next/image` where applicable; don't source unlicensed assets.
- Avoid unnecessary client JavaScript, animation libraries, and heavyweight UI packages.
- Persistent, consistent navigation: Courses, Certifications, How It Works, About, Contact, and auth entry points (when implemented).
- Call-to-action language must be accurate (e.g. “Explore courses” rather than “Enroll now” for an inactive purchasing flow).

---

## 7. SEO, discoverability and analytics readiness

- Configure correct site URL and metadata templates using the deployed canonical domain.
- Unique title/description and meaningful Open Graph metadata for all indexable pages; Twitter/X metadata where appropriate.
- `sitemap.ts` and `robots.ts` for intended public routes; exclude preview, auth callback, dashboards, development/test and private URLs.
- Canonicals for catalog/filter pages and correct 404 for invalid slug; avoid duplicate content from query variants.
- Structured data only where valid: Organization/WebSite, BreadcrumbList, FAQPage only if eligible and actually represented, Course data only for real course offerings with accurate properties. Validate schema output; avoid fake ratings/reviews.
- Optimize heading structure, internal linking, metadata and image loading.
- Keep third-party analytics optional, privacy-aware, and disabled until consent/configuration and provider are approved; implement a typed event taxonomy and adapter without fabricating production collection.
- Document eventual Search Console, indexing, and Core Web Vitals validation, but do not claim these are completed before real launch.

---

## 8. Security, privacy and reliability standards

- Validate contact inputs server-side with Zod and enforce lengths, allowlists, and safe handling.
- Implement anti-abuse and spam defenses for public forms; reuse production-capable rate-limiting infrastructure when available; document local-dev limitations.
- If contact service/mail provider is missing, **do not falsely display success**. Use a safe, clearly described local mail-capture flow or a verified mailto fallback until integration exists.
- Do not leak personal inquiry contents to logs or error messages; never display email-provider secrets.
- Apply safe navigation and open-redirect defenses. Avoid unsafe HTML rendering or sanitization shortcuts.
- Use only approved legal/policy content. A missing approved privacy policy is a release blocker for public collection of personal data; disable contact collection until approved or keep it local/test-only.
- Respect authentication state without exposing private information through cached static pages.
- Contact submission must have deterministic success/failure responses, graceful provider errors, and tests.

---

## 9. Phase execution steps

### STEP 3.1 — Baseline audit, route map and content inventory

**Goal:** Validate readiness and freeze a detailed, truthful public-site plan.

**Work:**

1. Inspect master plan, current routes, assets, style system, auth services, database and tests.
2. Map existing routes and conflicts; decide migration of `src/app/page.tsx` without duplicate `/`.
3. Inventory approved business claims, courses, certification tracks, instructors, legal policies, media, CTAs, and contact channels.
4. Produce site map and page/component inventory with content ownership and acceptance criteria.
5. Record decisions, nonblocking gaps and blockers in `docs/phase-3/CONTENT_INVENTORY.md` and `ROUTE_MAP.md`.

**Acceptance:** baseline commands recorded; no route-collision plan remains unresolved; data source/placeholder policy documented; no code modifications beyond planning needed.

**Exit:** validate docs and existing checks → review staged files → **commit** `docs(web): define phase 3 route and content inventory` → **push** the numbered feature branch → optional PR → **automatically proceed to 3.2** unless blocked.

### STEP 3.2 — Public layout, navigation and footer

**Goal:** Deliver the reusable public-site shell.

**Work:**

1. Implement/adjust `(marketing)/layout.tsx`, site config, desktop/mobile navigation, and footer.
2. Integrate verified logo/brand tokens; include responsive navigation, skip link and keyboard accessible menu.
3. Link to existing `/login` and `/register` only when Phase 2 routes are present; otherwise mark unavailable and avoid broken links.
4. Add footer sections: courses, certifications, company, help, legal, verified email; no unverified socials.
5. Ensure no duplicate homepage route and no conflict with protected layout groups.

**Acceptance:** shell responsive, keyboard operable, contrast checked, no hydration warnings, navigation and CTA destinations valid, typecheck/lint/tests/build pass.

**Exit:** tests and validation → **commit** `feat(web): implement accessible marketing layout and navigation` → **push numbered feature branch** → optional PR → **continue to 3.3**.

### STEP 3.3 — Home page and primary conversion journey

**Goal:** Publish a polished, truthful home page.

**Work:**

1. Create an engaging hero describing digital skills and professional exam preparation, with clear CTAs.
2. Add offering pillars, learning process, featured courses/tracks (only with verified/explicit preview data), reasons to learn, and FAQ preview.
3. Design for mobile/tablet/desktop, accessible hierarchy, optimized assets and sensible section density.
4. Avoid unsupported testimonials, partner badges, outcomes, statistics or guaranteed results.
5. Use reusable presentation components; keep business data outside the page component.

**Acceptance:** homepage works on target viewports, CTAs have real destinations, content can be reviewed, no layout shift/overflow, tests/build pass.

**Exit:** validate → **commit** `feat(web): build public homepage and discovery CTAs` → **push numbered feature branch** → optional PR → **continue to 3.4**.

### STEP 3.4 — Public course catalog

**Goal:** Deliver discovery of available or explicitly upcoming courses.

**Work:**

1. Define typed public catalog contracts and source-of-truth interface; use Prisma only if course schema and actual records exist.
2. Create `/courses` with responsive cards, category/level filters, keyword search, URL query state if appropriate, sort only by actual attributes, empty/loading/error states.
3. Clearly label preview/upcoming data; avoid unsupported prices and enrollment availability.
4. Ensure pagination/filter handling is accessible and produces sensible canonical/indexing behavior.
5. Add tests for filters, empty results and safe query handling.

**Acceptance:** search/filter reliable, keyboard accessible, data trustworthy, invalid inputs handled, no DB leakage, tests/build pass.

**Exit:** validate → **commit** `feat(catalog): implement public course discovery` → **push numbered feature branch** → optional PR → **continue to 3.5**.

### STEP 3.5 — Course details and CTA handoff

**Goal:** Give each real or explicitly preview course a stable discoverable page.

**Work:**

1. Create `/courses/[slug]` with summary, audience, prerequisites, learning outcomes and outline only if verified.
2. Add metadata/canonical/breadcrumb and not-found handling for invalid slugs.
3. Point CTA to existing registration/sign-in flow; do not implement fake enrollment or checkout.
4. Use static/dynamic rendering consistent with real content freshness and authorization requirements.
5. Test valid/invalid slugs, metadata generation, routes, and data fallback.

**Acceptance:** detail pages truthful, accessible, correctly indexed, invalid slugs 404, no false enrollment claims, tests/build pass.

**Exit:** validate → **commit** `feat(catalog): implement public course detail pages` → **push numbered feature branch** → optional PR → **continue to 3.6**.

### STEP 3.6 — Certification-preparation directory and tracks

**Goal:** Present exam-preparation offerings accurately without implying official exam-body affiliation.

**Work:**

1. Create `/certifications` and `/certifications/[slug]` with typed track data.
2. Show target certification, provider/issuer attribution, audience, prerequisites, preparation topics, learning pathway and accurate availability state.
3. Distinguish independent preparation from exam registration, actual issuer certification and authorized partner status.
4. Add sensible internal links to related courses only when records exist.
5. Test index/detail pages, slugs, empty results, metadata, disclaimers.

**Acceptance:** truthful positioning, no implied endorsement, clean navigation, accessible content, tests/build pass.

**Exit:** validate → **commit** `feat(certifications): add preparation discovery pages` → **push numbered feature branch** → optional PR → **continue to 3.7**.

### STEP 3.7 — About, How It Works and FAQ

**Goal:** Establish credibility through accurate explanatory content.

**Work:**

1. Implement `/about` using verified company information and approved mission/values.
2. Implement `/how-it-works` distinguishing available features from planned LMS/exam capabilities.
3. Implement `/faq` with evidence-based answers and accessible disclosure controls.
4. Use intentional internal links to catalog, certification tracks, account and contact pages.
5. Verify mobile layouts, content readability and semantic headings.

**Acceptance:** no unapproved claims, FAQ keyboard-accessible, navigation cohesive, tests/build pass.

**Exit:** validate → **commit** `feat(web): add about learning journey and FAQ pages` → **push numbered feature branch** → optional PR → **continue to 3.8**.

### STEP 3.8 — Contact workflow, privacy and legal surfaces

**Goal:** Provide reliable visitor support contact without exposing personal data.

**Work:**

1. Implement `/contact` with hello@mystackvarsity.com and a clear alternate contact method.
2. Add form only when approved privacy language and a functional local mail sink/verified delivery service are available; otherwise use a safe email-link fallback and record the blocker.
3. With a form, implement Zod validation, server-side submission, rate limiting, spam mitigation, safe errors, consent notice, and success/failure tests.
4. Add `/privacy` and `/terms` using **approved** legal copy only; if absent, do not present fabricated binding policies. Record release blocker or use clearly nonpublic review drafts.
5. Include accessible input labels, error association, status notifications, and no secret leakage.

**Acceptance:** contact email correct; no fake successful submissions; privacy requirement met before collecting live PII; abuse protection tested; legal text accurately represented; tests/build pass.

**Exit:** validate safe delivered scope → **commit** `feat(web): add secure contact and legal site surfaces` → **push numbered feature branch** → optional PR → **continue to 3.9** if release-blocker policy permits; otherwise pause for approval.

### STEP 3.9 — Technical SEO and structured discoverability

**Goal:** Make intended public pages search-engine-ready.

**Work:**

1. Configure metadata templates, page metadata, correct canonical domain, Open Graph/default social previews.
2. Implement sitemap and robots; exclude authenticated/private/preview/test endpoints.
3. Add breadcrumbs and eligible structured data; only include accurately supported properties.
4. Ensure invalid routes return genuine 404 and pages have unique descriptive titles.
5. Audit content hierarchy, internal links, image descriptions and public crawlability.
6. Document indexing decisions and launch-time Search Console actions.

**Acceptance:** valid sitemap/robots, no private indexed routes, no duplicate canonical errors, valid schema, no fabricated review/offer data, tests/build pass.

**Exit:** validate → **commit** `feat(seo): add metadata sitemap and structured discovery` → **push numbered feature branch** → optional PR → **continue to 3.10**.

### STEP 3.10 — Performance, accessibility and responsive QA

**Goal:** Improve usability and core technical quality across devices.

**Work:**

1. Run automated accessibility checks (axe or comparable), Playwright keyboard/screen-reader-oriented assertions, and manual audit checklist.
2. Test 360/390/768/1024/1440 widths for clipping, menu behavior, touch targets and readability.
3. Audit asset loading, fonts, caching, server/client boundaries, lazy loading and JS payload.
4. Measure local production-build Lighthouse/Web Vitals where feasible, noting environment limitations.
5. Address discovered issues without arbitrary, unmeasured optimization.

**Suggested engineering targets (not release guarantees):** no critical/serious automated accessibility findings; zero broken core links; no horizontal overflow; Lighthouse performance ≥90 on representative public routes where repeatable local audit supports it; optimize LCP/CLS/INP against current Web Vitals good thresholds as available.

**Acceptance:** tested viewport matrix, meaningful a11y improvements, no unresolved severe regressions, metrics documented and reproducible, tests/build pass.

**Exit:** validate → **commit** `perf(web): improve public site accessibility and speed` → **push numbered feature branch** → optional PR → **continue to 3.11**.

### STEP 3.11 — Analytics event contracts and conversion verification

**Goal:** Make discovery and conversion measurable without unapproved tracking.

**Work:**

1. Define typed events such as `public_cta_clicked`, `course_viewed`, `catalog_filter_changed`, `certification_track_viewed`, `contact_submitted` (only after success).
2. Implement a privacy-aware analytics abstraction that is disabled or no-op until an approved provider and consent policy exist.
3. Ensure no sensitive form fields, raw emails, tokens or personally identifying URLs are tracked.
4. Verify CTA destinations and the registration handoff; do not claim paid enrollment conversion is working before Phase 7.
5. Document event names, payloads, trigger conditions, data minimization and future integration points.

**Acceptance:** typed events tested, no uncontrolled third-party scripts, conversion route smoke checks pass, no PII leakage, tests/build pass.

**Exit:** validate → **commit** `feat(web): prepare privacy-aware discovery analytics` → **push numbered feature branch** → optional PR → **continue to 3.12**.

### STEP 3.12 — Full Phase 3 integration, security and release-readiness audit

**Goal:** Verify a cohesive public site and document any launch blockers.

**Work:**

1. Reconcile implementation against approved master plan, route inventory and all step criteria.
2. Run `npm run typecheck`, lint, format check, unit/integration/E2E tests, and production build using **actual existing scripts**.
3. Audit all public links, mobile nav, forms, 404, API responses, SEO files, structured data and auth entry points.
4. Verify security, dependency vulnerabilities, privacy copy, consent, content accuracy, and assets licensing.
5. Record performance/a11y metrics from executed tools; mark unexecuted work as unverified.
6. Create `docs/phase-3/PHASE_3_COMPLETION_REPORT.md` with status PASS / CONDITIONAL PASS / FAIL, test evidence, implemented routes, known limitations, unresolved blockers, recommended Phase 4 interfaces, and release decision.
7. Review `git diff`, commit and push the numbered Phase 3 feature branch, and prepare one reviewable PR summary with base `development` and head the numbered feature branch. Do not merge or deploy.

**Acceptance:** all critical journeys work; no high/critical unresolved security findings; no user-facing false claims; core checks pass; legal/privacy blockers clearly distinguished; final report complete.

**Exit:** validate → **commit** `chore(web): complete phase 3 public website readiness review` → **push numbered feature branch** → **prepare Phase 3 PR message for manual merge into development** → **STOP; do not begin Phase 4**.

---

## 10. Mandatory autonomous agent operating protocol

### 10.1 Branching and integration policy — mandatory

**The agent must NOT commit or push Phase 3 implementation directly to `development`, `Staging-I`, `Staging-II`, or `main`.** Those branches remain protected integration/promotion branches controlled by the repository owner.

**Feature branch numbering:** Use `feature/NNN-phase-3-public-website`, where `NNN` is a three-digit, monotonically increasing number across the repository's existing numbered feature branches (not a fixed phase number). Inspect both local and remote branches (and open PRs) to find the highest existing number, then select the next available number. Example: if `feature/006-phase-2-identity` is highest, use `feature/007-phase-3-public-website`. If no numbered feature branch exists, begin with `feature/001-phase-3-public-website`. Do not reuse an existing number for a different feature. If the Phase 3 branch already exists and is valid, resume it instead of creating a duplicate. Never rename or delete somebody else's branch to make numbering work.

**One numbered feature branch for all Phase 3 steps.** Complete Steps 3.1–3.12 as separate, reviewable conventional commits on that branch, pushing the same branch after each successful step. Do not create a new branch for every step; that would result in stacked PR dependencies and conflicts while manual merges are pending.

**PR base/head:** `development` ← `feature/NNN-phase-3-public-website`. After Step 3.12, write a complete PR title and description for the user to submit or review on GitHub. If GitHub CLI/API and access are already available, the agent may open a **draft** PR with the same target; never merge it. If PR tooling is unavailable, writing the PR message and providing the comparison path/instructions meets the handoff requirement. Do not claim a PR was created unless confirmed.

**Manual promotion workflow:** The user alone decides and performs `feature → development`, then `development → Staging-I`, `Staging-I → Staging-II`, and `Staging-II → main` (or another explicitly approved promotion sequence). The agent must not merge, cherry-pick, rebase onto, or push to those branches as part of Phase 3. It may fetch them read-only. Nothing in Phase 3 implies automatic staging or production deployment.

### 10.2 Continuation logic

The user authorizes the agent to execute all Steps 3.1–3.12 sequentially, subject to tool permissions and safe-operation boundaries.

After each successful step:

1. Briefly report changed files, actual tests, findings, commit SHA, branch name, and push status.
2. Commit only relevant reviewed changes with that step's specified conventional message.
3. Push the Phase 3 numbered feature branch using `git push -u origin <feature-branch>` on its first push and `git push origin <feature-branch>` subsequently.
4. Continue immediately to the next step **without waiting for a merge into `development`**.
5. At the end of Step 3.12, prepare the manual PR summary and stop. Do not begin Phase 4.

Do not ask for confirmation for routine safe implementation, compatible dependencies, local testing, or non-destructive changes. Document noncritical assumptions and continue.

### 10.3 Stop conditions

Pause for the smallest specific input only when genuinely blocked by:

- Missing approved business/legal claims that would otherwise have to be fabricated.
- Essential credentials or verified service integration with no safe local/test substitute.
- Ambiguous existing branch numbering, an already used Phase 3 branch with incompatible changes, unrelated dirty worktree changes, or an irreconcilable Git conflict.
- A destructive database/Git action, secret exposure, production deployment, or remote merge.
- Unresolved release-blocking test failures, security findings, or implementation conflicts.
- Missing remote push permissions where a required push cannot succeed.

If a nonessential external integration is unavailable, use an explicitly labeled local-only adapter or defer safely; do not fake real delivery, legal approval, deployed analytics, or working services. Do not mark a required feature complete if its acceptance criteria are unmet.

### 10.4 Safe Git commands and safeguards

Use commands suitable for the actual terminal. On initial setup, **inspect before selecting the number**:

```bash
git status --short
git branch --show-current
git fetch origin --prune
git branch -a --list 'feature/*'
git branch -r --list 'origin/feature/*'
```

Check branch identifiers on GitHub or in fetched refs for collisions, including PRs when possible. If the numbered feature branch is not present, create it **from `origin/development`**, for example:

```bash
git switch -c feature/007-phase-3-public-website origin/development
```

`007` is an illustration only; compute the real next number. If the branch already exists, resume it after checking ownership/history and a clean working tree.

After each successful step:

```bash
git status --short
git diff --check
git diff --cached --check
# Stage only intended files, after secret/unrelated-change review.
git add <reviewed-paths>
git commit -m "<step conventional commit message>"
git push -u origin <actual-numbered-feature-branch>  # first push only
# Later pushes: git push origin <actual-numbered-feature-branch>
```

Never use `git push --force`, hard reset, delete unrelated files, commit secrets, alter unrelated code, or rewrite shared history. If staging a subset is impractical, inspect all files individually before using `git add -A`.

### 10.5 Quality gate for every step

- Scoped acceptance criteria and targeted tests pass.
- TypeScript, ESLint and formatting checks pass.
- Production build passes when supported by the step; inherited limitations are reported truthfully.
- No new critical/high security or privacy defects or material accessibility regressions.
- Documentation is updated.
- Reviewed scoped commit exists and remote feature-branch push is confirmed.
- Automatic continuation is allowed only if the above gate is satisfied.

### 10.6 Reporting schema after every step

```text
Step: 3.x — <name>
Status: PASS / BLOCKED
Branch: feature/NNN-phase-3-public-website (actual number)
Files: <created and changed>
Tests: <commands and actual pass/fail results>
Security/content review: <findings and evidence>
Commit: <SHA and message / unavailable>
Push: <confirmed remote feature-branch / failed and why>
PR: <planned for final / draft URL / manual summary provided>
Next: <next step automatically or exact blocker>
```

### 10.7 Final manual integration workflow

1. Verify all Step 3.1–3.12 commits are pushed to the numbered Phase 3 feature branch.
2. Compare `origin/development...origin/<feature-branch>` and check for unrelated changes.
3. Generate the PR title and summary using Section 15 below.
4. Optionally create a **draft PR targeting `development`**, if supported; otherwise deliver the text for manual PR creation.
5. Stop. Await the owner's manual PR merge and staging/main promotions.

---

## 11. Test matrix and definition of done

| Area           | Required verification                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Routing        | All specified public routes load; invalid course/certification slugs 404; no duplicate `/`                                |
| Navigation     | Header/footer valid; keyboard accessible mobile menu; correct auth handoff                                                |
| Catalog        | Valid search/filter; URL state if used; graceful empty/error results                                                      |
| Course pages   | Accurate content; no invented claims; metadata and canonical correct                                                      |
| Certifications | No implied official endorsement; accurate prep-vs-issuer distinctions                                                     |
| Contact        | Validated input, real delivery or safe fallback, anti-abuse, no false success, privacy requirements                       |
| SEO            | Unique metadata, sitemap/robots, structured data, canonicals, private-route exclusion                                     |
| Accessibility  | Semantic landmarks, focus, labels, contrast, keyboard, reduced motion, responsive behavior                                |
| Performance    | Production build; representative route measurements; image/font/JS optimization evidence                                  |
| Security       | No secrets/PII in client or logs; no unprotected sensitive endpoints; dependency review                                   |
| QA             | Unit/component/integration/E2E tests, typecheck, lint, format, build                                                      |
| Git            | Reviewed commits per step, pushed to the numbered feature branch; final PR summary targets `development` for manual merge |

### Definition of Done (Phase 3)

Phase 3 is **PASS** only when the public site is cohesive, truthful, responsive, accessible, technically discoverable, security-reviewed, tested, documented and committed/pushed to the numbered Phase 3 feature branch. The final PR is targeted to `development` for manual review and remains unmerged. A Phase 3 code-complete result does **not** mean live launch: deployment, real search indexing, approved legal policies, production contact delivery, and external analytics may remain Phase 9–10 launch dependencies and must be named clearly.

A **CONDITIONAL PASS** is permitted only for nonblocking limitations that do not create unsafe public data collection, false claims, or broken core journeys. **FAIL** means a core deliverable or critical security/privacy requirement remains unmet.

---

## 12. Reusable single-message coding-agent prompt

> Copy this prompt into the coding agent after saving this file in the repository as `docs/phase-3/PHASE_3_MASTER_PLAN.md`.

```text
Act as Stack Varsity V1's lead Next.js developer, frontend architect,
accessibility specialist, SEO engineer, security reviewer, QA engineer,
and technical writer.

Execute all of Phase 3 (Steps 3.1 to 3.12) from:
- docs/MASTER_PLAN.md
- docs/phase-3/PHASE_3_MASTER_PLAN.md
- the existing Phase 1/2 architecture, security, branding, and testing docs.

This is a Next.js App Router TypeScript modular monolith with PostgreSQL/Prisma.
Business: Stack Varsity — Build • Educate • Innovate.
Domain: www.mystackvarsity.com. Email: hello@mystackvarsity.com.

MANDATORY GIT WORKFLOW:
1. Before touching files, inspect Git working state, fetch remote refs, and
   determine the next unused, consecutive three-digit feature branch number
   across local/remote branches; resume an existing valid Phase 3 branch if any.
2. Create/switch to feature/NNN-phase-3-public-website FROM origin/development.
   NNN is computed from the repo; do not assume 001 or 003.
3. Work ONLY on this numbered feature branch throughout Phase 3.
4. For EACH step: implement; test; fix; audit; update docs; review changes;
   commit using the step's conventional commit message; PUSH the feature branch.
5. Continue to the next step AUTOMATICALLY after successful push and checks.
   No confirmation is needed for routine safe implementation.
6. After Step 3.12, write a complete PR title and summary with tests and risks,
   from this feature branch INTO development. If GitHub tooling is available,
   you MAY create a DRAFT PR, but DO NOT merge it. Never push directly to
   development, Staging-I, Staging-II, or main.
7. The USER manually controls all merges: feature → development, then
   promotion through Staging-I, Staging-II, and main.
8. STOP after Phase 3; do not start Phase 4 or deploy.

SCOPE:
Follow every Step 3.1–3.12 exactly as defined in the Phase 3 plan: audit;
site shell; homepage; course catalog; course details; certification
preparation pages; company/how-it-works/FAQ; contact/legal; technical SEO;
a11y/performance; privacy-aware analytics readiness; final integration audit.

Avoid invented courses, prices, instructors, endorsements, reviews, pass rates,
legal approval, or working integrations. Use truthful approved content and
clearly marked safe draft/coming-soon states as needed.

STOP only for a genuine unresolved blocker: required user input, unsafe or
destructive action, conflict, serious security flaw, unfixable test failure,
or missing remote push permission. Do not fabricate success or conceal issues.

DELIVERABLES:
- Working public routes/components and appropriately scoped tests.
- docs/phase-3/PHASE_3_COMPLETION_REPORT.md
- Individual commits and confirmed pushes for all 12 steps.
- A human-ready Phase 3 PR title/body targeting development, with commit range,
  change summary, test evidence, content/security caveats and manual merge notes.

Begin Step 3.1 now and proceed automatically until Step 3.12 or a true blocker.
```

---

## 13. Phase 3 step summary

| Step | Outcome                                 | Exit commit                                                       |
| ---- | --------------------------------------- | ----------------------------------------------------------------- |
| 3.1  | Audit, routes and content inventory     | `docs(web): define phase 3 route and content inventory`           |
| 3.2  | Public layout and navigation            | `feat(web): implement accessible marketing layout and navigation` |
| 3.3  | Home page                               | `feat(web): build public homepage and discovery CTAs`             |
| 3.4  | Course catalog                          | `feat(catalog): implement public course discovery`                |
| 3.5  | Course details                          | `feat(catalog): implement public course detail pages`             |
| 3.6  | Certification directory and tracks      | `feat(certifications): add preparation discovery pages`           |
| 3.7  | About, How It Works, FAQ                | `feat(web): add about learning journey and FAQ pages`             |
| 3.8  | Contact and legal surfaces              | `feat(web): add secure contact and legal site surfaces`           |
| 3.9  | Metadata, structured data, sitemap      | `feat(seo): add metadata sitemap and structured discovery`        |
| 3.10 | Accessibility and performance QA        | `perf(web): improve public site accessibility and speed`          |
| 3.11 | Privacy-aware analytics readiness       | `feat(web): prepare privacy-aware discovery analytics`            |
| 3.12 | Integration and release-readiness audit | `chore(web): complete phase 3 public website readiness review`    |

**Every step ends:** **Validate → Fix → Review → Commit → Push numbered feature branch → Auto-continue**. Step 3.12 additionally prepares the **PR summary into `development`** and **STOPS**. No merge occurs automatically.

---

## 14. Explicit exclusions and handoff to later phases

- **Phase 4 (LMS):** course authoring, lessons, media learning delivery, enrollment workflows, progress tracking, learner dashboards.
- **Phase 5 (Certification preparation):** full preparation programs and candidate progression logic.
- **Phase 6 (Assessment):** question banks, mock exams, timing, scoring, results and analytics.
- **Phase 7 (Payments):** Paystack checkout, subscriptions, invoicing, access entitlements.
- **Phase 8 (Administration):** complete content and user administration, reporting.
- **Phases 9–10:** end-to-end security hardening, operational monitoring, production deployment, formal legal review, live delivery validation, SEO indexing, analytics activation and launch.

Phase 3 should leave clear interfaces for these future systems without building them early.

---

**Document status:** Phase 3 execution-ready planning specification; subject to reconciliation against the repository's authoritative master plan and approved business content.  
**Prepared:** 13 November 2026.

---

## 15. Pull request summary and manual merge handoff

**PR title (recommended):** `feat(web): Phase 3 public website and discovery experience`

**PR base:** `development`  
**PR compare/head:** `feature/NNN-phase-3-public-website` (replace `NNN` with actual number)  
**PR type:** Draft initially if the owner wants a final content/legal review; otherwise ready-for-review after PASS.

### Ready-to-paste PR description template

```markdown
## Summary

Implements Phase 3 of Stack Varsity V1: the accessible, responsive public website
and read-only discovery experience, following the Next.js modular-monolith plan.

## Feature branch and target

- Source: `feature/NNN-phase-3-public-website`
- Target: `development`
- Integration/production merges are manual and owner-controlled.

## Changes delivered

- [ ] Route and approved-content inventory
- [ ] Shared public site header, navigation and footer
- [ ] Homepage and clear registration entry points
- [ ] Course catalog search/filter and course details
- [ ] Certification-preparation index and details
- [ ] About, How It Works and FAQ pages
- [ ] Secure contact form and accurate legal-page status
- [ ] Metadata, canonical URLs, sitemap, robots and structured data
- [ ] Accessibility, mobile responsiveness and performance improvements
- [ ] Privacy-aware analytics event contracts
- [ ] Automated tests and Phase 3 completion report

## Validation performed

| Check                            | Result                | Evidence / command |
| -------------------------------- | --------------------- | ------------------ |
| TypeScript                       | PASS / FAIL / NOT RUN |                    |
| ESLint                           | PASS / FAIL / NOT RUN |                    |
| Prettier                         | PASS / FAIL / NOT RUN |                    |
| Unit/component/integration tests | PASS / FAIL / NOT RUN |                    |
| E2E (Playwright)                 | PASS / FAIL / NOT RUN |                    |
| Production build                 | PASS / FAIL / NOT RUN |                    |
| Accessibility/responsive checks  | PASS / FAIL / NOT RUN |                    |
| Security/content review          | PASS / FAIL / NOT RUN |                    |

## Release notes / known limitations

- Content and assets requiring approval: [list, or none]
- Contact delivery, analytics, legal review or external integrations deferred: [list, or none]
- Known issues and risk classification: [list, or none]
- No LMS, exam-engine, payment or production-deployment features are included.

## Reviewer checklist

- [ ] Review `docs/phase-3/PHASE_3_COMPLETION_REPORT.md`
- [ ] Verify route/CTA correctness and content claims
- [ ] Review security and privacy impact
- [ ] Review test evidence and responsive design
- [ ] Manually merge this PR into `development` when approved
- [ ] Promote manually to `Staging-I`, `Staging-II`, then `main` per release policy

## Evidence

- Completion report: `docs/phase-3/PHASE_3_COMPLETION_REPORT.md`
- Commit list / range: [actual commit SHA range]
- Screenshots, test outputs, or audit links: [actual references]
```

### Commands for owner/reviewer

Do not assume the branch number or run these until the agent supplies the actual branch name:

```bash
# Verify the branch is pushed
git fetch origin
# Compare changes intended for development
git log --oneline origin/development..origin/feature/NNN-phase-3-public-website
git diff --stat origin/development...origin/feature/NNN-phase-3-public-website
```

The owner may open GitHub's **Compare & pull request** UI, set base to `development`, compare to the actual numbered feature branch, paste the generated PR description, review and manually merge. Subsequent staging and main merges remain exclusively the owner's responsibility.
