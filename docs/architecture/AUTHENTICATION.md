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
