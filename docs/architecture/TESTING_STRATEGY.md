# Stack Varsity V1 — Testing Strategy

## 1. Testing Layers

| Layer | Framework | Directory | Environment |
|---|---|---|---|
| **Unit Tests** | Vitest | `tests/unit/` | `node` (default) |
| **Component Tests** | Vitest + React Testing Library + `@testing-library/jest-dom` | `tests/unit/` (or `*.test.tsx` with `@vitest-environment jsdom`) | `jsdom` |
| **Integration Tests** | Vitest | `tests/integration/` | `node` |
| **End-to-End Tests** | Playwright (`chromium`, `firefox`, `webkit`) | `tests/e2e/` | Browser |

---

## 2. Commands

| Script | Purpose |
|---|---|
| `npm test` | Run all Vitest unit and integration tests |
| `npm run test:unit` | Run unit & component tests in `tests/unit/` |
| `npm run test:integration` | Run integration tests in `tests/integration/` |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:coverage` | Run Vitest with V8 coverage (`text`, `html`, `lcov`) |
| `npm run test:e2e` | Run Playwright E2E smoke tests |

---

## 3. Conventions & Standards

- **Path Aliases**: `@/*` resolves to `./src/*` in [vitest.config.ts](../../vitest.config.ts).
- **Accessible Queries**: Prefer `getByRole`, `getByLabelText`, and `getByText` over brittle CSS/test-id selectors.
- **Database Isolation**: Integration tests involving PostgreSQL must target a dedicated isolated test database (`NODE_ENV=test`) and must never run destructive operations against development or production databases.
- **Mocking**: Mock external third-party APIs (Paystack, email providers) and `server-only` (mocked in [tests/setup.ts](../../tests/setup.ts)) at module boundaries; avoid over-mocking internal business logic.
- **Coverage**: Excludes `node_modules/`, `.next/`, `src/generated/`, `*.d.ts`, `*.config.*`, and `tests/`. Focus on meaningful assertions for critical paths (auth, RBAC, exam scoring, payments, health checks) rather than inflating coverage with trivial tests.
- **CI Compatibility**: `vitest run` and `playwright.config.ts` (`forbidOnly: !!process.env.CI`, `retries: process.env.CI ? 2 : 0`) are CI-ready. In CI, install Playwright browsers via `npx playwright install --with-deps`.
