# Stack Varsity V1 — Authentication Architecture

## 1. Overview

Stack Varsity V1 uses **Auth.js v5 (`next-auth@beta`)** integrated with **PostgreSQL via Prisma 7** and **Argon2id** credential hashing. All authentication internals live in `src/modules/auth/` and are protected by `import "server-only"`.

---

## 2. Session Strategy & Revocation Characteristics

Stack Varsity uses a **hybrid encrypted-JWT + server-persisted PostgreSQL `Session`** architecture:

1. **Cookie Transport**: Auth.js issues an encrypted, `HttpOnly`, `SameSite=Lax` cookie (`__Secure-authjs.session-token` in production, `authjs.session-token` in local development).
2. **Server-Side Persistence**: Every successful sign-in creates a row in the PostgreSQL `sessions` table with a cryptographically random `sessionToken`, `expires` timestamp, `ipAddress`, `userAgent`, and `mfaVerifiedAt`.
3. **Server-Side Validation**: `getCurrentSession()` and `requireAuth()` validate the cookie's `sessionToken` against PostgreSQL on every request, verifying:
   - The session row exists and has not expired.
   - The user is not soft-deleted (`deletedAt === null`).
   - The user's `status` is `ACTIVE` (immediately rejecting `SUSPENDED` or `DISABLED` accounts).
4. **Immediate Revocation**:
   - **Logout** deletes the `Session` row from PostgreSQL.
   - **Password reset** and **account suspension** call `revokeAllUserSessions(userId)`, immediately invalidating all active sessions across devices.

---

## 3. Credential Security

- **Password Hashing**: Argon2id via `@node-rs/argon2` (`memoryCost: 19456` KiB, `timeCost: 2`, `parallelism: 1`).
- **Timing Attack Mitigation**: Unknown-account login attempts execute `verifyDummyPassword()` to equalize response timing.
- **No Secret Exposure**: `passwordHash` is never returned in API responses, session objects, or client props.
- **Email Verification Policy**: Credentials sign-in requires `emailVerified !== null` and `status === "ACTIVE"`.

---

## 4. Server-Only Helpers (`src/modules/auth/server-auth.ts`)

- `getCurrentSession()` — Returns the validated `ValidDatabaseSession` or `null`.
- `getCurrentUser()` — Returns the authenticated `AuthenticatedUser` projection or `null`.
- `requireAuth()` — Returns the validated session or throws `UnauthorizedError` (401).
- `requireActiveUser()` — Returns the active user or throws `UnauthorizedError` (401).

---

## 5. Student Registration (`/register` & `POST /api/auth/register`)

- **Validation**: `registerSchema` (Zod `.strict()`) enforces required fields, normalized lowercase email (`<= 254` chars), full name (`2..100` chars), strong password policy (`10..128` chars with uppercase, lowercase, digit, and symbol), and password confirmation.
- **Privilege Protection**: `.strict()` rejects any client-supplied `role`, `status`, `emailVerified`, `mfaEnabled`, or `permissions` fields. `registerStudent()` explicitly persists `role: "STUDENT"`, `status: "ACTIVE"`, and `emailVerified: null`.
- **Concurrency & Rate Limiting**: Duplicate emails (including concurrent `P2002` races) return `409 Conflict`. `POST /api/auth/register` applies IP-based rate limiting (5 attempts per 15 minutes in the local limiter; distributed Redis/PostgreSQL store required for multi-instance production).

---

## 6. Email Verification (`/verify-email`, `/api/auth/verify-email`, `/api/auth/resend-verification`)

- **Token Storage**: `EmailVerificationToken` stores only the SHA-256 `tokenHash` of a 32-byte cryptographically random token (24-hour TTL). Raw tokens are never stored or logged.
- **Atomic Single-Use Consumption**: Verification uses an atomic `updateMany` (`consumedAt: null` and `expiresAt > now`) inside `db.$transaction` so concurrent requests cannot replay a token.
- **Anti-Enumeration & Rate Limiting**: `POST /api/auth/resend-verification` always returns a generic `200 OK` message regardless of account existence and is rate-limited (3 requests per 15 minutes per IP).
- **Email Delivery**: `src/server/mail.ts` dispatches via `EMAIL_PROVIDER_API_KEY` when configured and falls back to safe server-only local capture in development/test.

---

## 7. Login, Logout & Session Lifecycle (`/login`, `/api/auth/login`, `/api/auth/logout`)

- **Rate Limiting & Generic Errors**: `POST /api/auth/login` limits attempts (10 per 15 minutes per IP+email) and always returns a generic `"Invalid email or password."` error on failure.
- **Remember-Session Support**: Standard sessions use a 12-hour server-side TTL; opting into "Keep me signed in" extends the server-side TTL to 7 days.
- **Open-Redirect Protection**: `sanitizeRedirectPath()` rejects external URLs, protocol-relative URLs (`//`), and scheme-prefixed paths.
- **Logout**: `POST /api/auth/logout` deletes the PostgreSQL `Session` row and clears the Auth.js session cookie.
