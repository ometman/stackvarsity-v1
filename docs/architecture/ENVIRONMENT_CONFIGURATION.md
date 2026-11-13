# Stack Varsity V1 — Environment Configuration

## 1. Overview

Environment variables are validated at runtime with **Zod** and strictly separated into:

- **Public browser variables** (`NEXT_PUBLIC_*`) in [src/config/public-env.ts](../../src/config/public-env.ts)
- **Server-only variables** in [src/config/server-env.ts](../../src/config/server-env.ts) (protected by `import "server-only"`)

Importing `src/config/server-env.ts` from a Client Component triggers a Next.js build error, preventing accidental exposure of database credentials, auth secrets, or private API keys to the browser.

---

## 2. Environment Variable Inventory

| Variable | Scope | Status | Description |
|---|---|---|---|
| `NODE_ENV` | Server | Auto-set | Runtime mode (`development`, `test`, `production`) |
| `NEXT_PUBLIC_APP_NAME` | Public | Defaulted | Display name (`Stack Varsity`) |
| `NEXT_PUBLIC_APP_URL` | Public | Defaulted | Canonical app URL (`http://localhost:3000` locally) |
| `DATABASE_URL` | Server | Required for DB | PostgreSQL connection string (`postgresql://...`) |
| `AUTH_SECRET` | Server | Planned (Phase 2) | Auth.js session encryption secret (32+ chars when set) |
| `AUTH_URL` | Server | Planned (Phase 2) | Auth.js canonical callback URL |
| `PAYSTACK_SECRET_KEY` | Server | Planned (Phase 7) | Paystack server-side API secret key |
| `PAYSTACK_WEBHOOK_SECRET` | Server | Planned (Phase 7) | Paystack webhook HMAC verification secret |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Public | Planned (Phase 7) | Paystack browser-safe public key |
| `EMAIL_PROVIDER_API_KEY` | Server | Planned (Phase 8) | Transactional email provider API key |
| `EMAIL_FROM` | Server | Planned (Phase 8) | Default sender address (`hello@mystackvarsity.com`) |

---

## 3. Local Setup

1. Copy [.env.example](../../.env.example) to `.env.local`:
   ```powershell
   Copy-Item .env.example .env.local
   ```
2. Update `DATABASE_URL` in `.env.local` to match your local PostgreSQL instance.
3. Leave future-phase variables (`AUTH_SECRET`, `PAYSTACK_*`, `EMAIL_*`) empty until their phases are implemented.

---

## 4. Security & Git Rules

- [.gitignore](../../.gitignore) ignores `.env*` (`.env.local`, `.env.production`, etc.) while keeping `!.env.example` tracked.
- Never commit real credentials or `.env.local` files.
- Never log or print secret values in application logs or error messages. `parseServerEnv` and `requireServerEnv` report only variable names and validation messages.
