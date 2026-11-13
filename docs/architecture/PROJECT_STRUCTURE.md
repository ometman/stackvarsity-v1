# Stack Varsity V1 — Project Structure

## Architectural Overview

Stack Varsity V1 is built as a single **Next.js App Router** application following the **Modular Monolith** architectural pattern. Business domains are separated into cohesive modules while keeping routing, shared UI, infrastructure, configuration, and data access cleanly bounded.

### Core Layering & Boundaries

1. **Presentation (`src/app`, `src/components`)**: Next.js App Router pages, layouts, route handlers, and React UI components. Client Components must never import database repositories or server-only infrastructure directly.
2. **Business Logic (`src/modules`)**: Domain-oriented modules encapsulating use cases, domain rules, validation schemas, and module-level services. Modules expose explicit public interfaces and avoid tight coupling across domain boundaries.
3. **Data Access (Server-Side Repositories)**: Database queries and persistence logic live in server-side repositories (backed by Prisma / PostgreSQL) and are invoked only from server contexts (Server Components, Server Actions, Route Handlers, and module services).
4. **Infrastructure (`src/server`)**: Cross-cutting server-only concerns such as database client initialization, logging, auth session helpers, payment gateway adapters, and external service integrations.
5. **Shared Utilities (`src/lib`)**: Pure, framework-agnostic helper functions, formatting utilities, and shared non-domain helpers.
6. **Configuration (`src/config`)**: Environment validation, application constants, navigation definitions, and feature/runtime configuration.

---

## Directory Responsibilities

### Root Directories

| Directory            | Responsibility                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/`               | Application source code (routing, UI, domain modules, server infrastructure, shared utilities).           |
| `public/`            | Static assets served directly by Next.js (`images/`, `icons/`, `fonts/`).                                 |
| `prisma/`            | Prisma schema, client configuration, and ORM-level database definitions.                                  |
| `database/`          | Supporting SQL/database artifacts (`migrations/`, `seeds/`).                                              |
| `tests/`             | Automated test suites separated by level: `unit/`, `integration/`, and `e2e/`.                            |
| `docs/`              | Project documentation, including `MASTER_PLAN.md`, `MASTER_INSTRUCTIONS.md`, `architecture/`, and `api/`. |
| `infra/`             | Local and deployment infrastructure definitions (e.g., `infra/docker/`).                                  |
| `scripts/`           | Developer, maintenance, and automation scripts.                                                           |
| `.github/workflows/` | GitHub Actions CI/CD, linting, testing, and security scanning workflows.                                  |

---

### `public/` — Static Assets

- `public/images/` — Raster/vector images, course thumbnails, and brand media.
- `public/icons/` — Static icon assets, favicons, and app icons.
- `public/fonts/` — Self-hosted font files (when not loaded via `next/font`).

---

### `src/app/` — Next.js App Router

Route groups organize pages by audience and layout without affecting URL paths or duplicating routes:

- `src/app/(marketing)/` — Public-facing pages (homepage, course catalog, about, pricing, legal/policy pages).
- `src/app/(auth)/` — Authentication flows (sign in, registration, password reset, MFA verification).
- `src/app/(student)/` — Learner portal (enrolled courses, lesson player, practice quizzes, mock exams, progress).
- `src/app/(instructor)/` — Content authoring and review workspace (courses, lessons, question bank management).
- `src/app/(admin)/` — Platform administration (users, enrollments, payments, audit logs, reporting).
- `src/app/api/` — Next.js Route Handlers (REST endpoints, health checks, payment webhooks, auth callbacks).

---

### `src/components/` — Shared UI Components

- `src/components/ui/` — Base design-system primitives (e.g., buttons, inputs, dialogs, cards via shadcn/ui).
- `src/components/layout/` — Reusable shell components (headers, footers, sidebars, navigation).
- `src/components/shared/` — Cross-feature composite components reused across multiple route groups.

---

### `src/modules/` — Business Modules

Each business module owns its domain logic, validation contracts, and explicit public interface:

- `src/modules/auth/` — Authentication workflows, session policies, and role/permission enforcement.
- `src/modules/users/` — User profiles, account settings, and role metadata.
- `src/modules/courses/` — Course catalog, syllabi, modules, lessons, and publishing lifecycle.
- `src/modules/enrollments/` — Learner enrollments, access entitlements, and expiration rules.
- `src/modules/learning/` — Lesson completion, learner progress tracking, and study continuity.
- `src/modules/examinations/` — Certification blueprints, question bank, timed mock attempts, server-authoritative scoring, and results.
- `src/modules/payments/` — Orders, checkout initiation, Paystack verification, webhook idempotency, and refunds.
- `src/modules/administration/` — Admin workflows, platform metrics, moderation, and audit reporting.

---

### Supporting `src/` Directories

- `src/config/` — Typed environment configuration, site metadata, and application constants.
- `src/hooks/` — Reusable client-side React hooks.
- `src/lib/` — Shared pure utilities and helpers.
- `src/server/` — Server-only infrastructure (DB client, logger, mail/payment adapters, security helpers).
- `src/types/` — Shared TypeScript types and ambient declarations.
