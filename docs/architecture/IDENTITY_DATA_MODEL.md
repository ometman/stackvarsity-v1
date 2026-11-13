# Stack Varsity V1 — Identity Data Model

## 1. Overview

This document defines the PostgreSQL and Prisma identity data model for Stack Varsity V1. The schema supports:

- Local credentials and provider-linked authentication
- Server-persisted sessions with immediate revocation and MFA verification state
- Single-use, hashed email verification tokens
- Single-use, hashed password reset tokens
- Least-privilege Role-Based Access Control (`STUDENT`, `INSTRUCTOR`, `ADMIN`)
- Lifecycle account states (`ACTIVE`, `SUSPENDED`, `DISABLED`) independent of email verification
- Security audit logging for sensitive identity and access events

---

## 2. Enums

| Enum           | Values                            | Purpose                                                                            |
| -------------- | --------------------------------- | ---------------------------------------------------------------------------------- |
| `UserRole`     | `STUDENT`, `INSTRUCTOR`, `ADMIN`  | Authoritative application roles. Public registration always defaults to `STUDENT`. |
| `UserStatus`   | `ACTIVE`, `SUSPENDED`, `DISABLED` | Account lifecycle status, independent of `emailVerified`.                          |
| `AuditOutcome` | `SUCCESS`, `FAILURE`, `DENIED`    | Outcome classification for `SecurityAuditEvent`.                                   |

---

## 3. Core Models

### `User` (`users`)

- **Primary key**: `id` (`cuid()`)
- **Identity**: `name`, `email` (unique, normalized lowercase), `emailVerified` (`DateTime?`), `image`
- **Credentials**: `passwordHash` (`String?`, Argon2id hash; never exposed to clients or session objects)
- **Authorization & Lifecycle**: `role` (`UserRole`, default `STUDENT`), `status` (`UserStatus`, default `ACTIVE`), `mfaEnabled` (`Boolean`, default `false`), `lastLoginAt`, `deletedAt`
- **Indexes**: `role`, `status`, `deletedAt`

### `Account` (`accounts`)

- Stores external/OAuth provider links compatible with Auth.js.
- Unique constraint on `(provider, providerAccountId)`.
- Cascading delete when the owning `User` is deleted.

### `Session` (`sessions`)

- Server-persisted session records keyed by unique `sessionToken`.
- Includes `expires`, `ipAddress`, `userAgent`, and `mfaVerifiedAt` (tracks whether an administrator session has completed MFA verification).
- Enables immediate server-side session revocation on logout, password reset, or account suspension.

### `EmailVerificationToken` (`email_verification_tokens`)

- Stores **only** `tokenHash` (SHA-256 hash of the cryptographically random bearer token), never the plaintext token.
- Single-use enforcement via `consumedAt` and `expiresAt`.

### `PasswordResetToken` (`password_reset_tokens`)

- Stores **only** `tokenHash`, `expiresAt`, `consumedAt`, and `requestedIp`.
- Enforces atomic single-use consumption and invalidation of active sessions upon password reset.

### `SecurityAuditEvent` (`security_audit_events`)

- Records security-relevant actions (`actorId`, `targetUserId`, `eventType`, `outcome`, `ipAddress`, `userAgent`, `metadata`, `createdAt`).
- Uses `onDelete: SetNull` on user relations so audit history is preserved even if a user record is removed.
- **Rule**: Never store plaintext passwords, verification/reset tokens, or MFA secrets in `metadata`.

---

## 4. Security & Integrity Guarantees

1. **Least Privilege**: `User.role` defaults to `STUDENT`. Public registration must never accept role or status overrides.
2. **Independent Verification & Status**: `emailVerified` records email ownership confirmation independently from `status` (`ACTIVE` / `SUSPENDED` / `DISABLED`), so an account can be suspended without losing verification history.
3. **Token Confidentiality**: Verification and password reset tokens are stored exclusively as cryptographic hashes (`tokenHash`).
4. **MFA Readiness**: `User.mfaEnabled` and `Session.mfaVerifiedAt` prepare the schema for Administrator TOTP MFA and recovery codes in Step 2.9.
