# Stack Varsity V1 — Security Controls & Administrator MFA

## 1. Administrator Multi-Factor Authentication (TOTP)

- **Algorithm**: RFC 6238 TOTP (`otpauth`, SHA-1, 6 digits, 30-second period, `window: 1`).
- **Encrypted Secret Storage**: TOTP secrets are encrypted at rest with **AES-256-GCM** using a key derived from `AUTH_SECRET` (`src/modules/auth/mfa-crypto.ts`) and stored in `AdminMfaFactor.encryptedSecret`. Plaintext TOTP secrets are never persisted.
- **Replay Protection**: `AdminMfaFactor.lastUsedStep` records the last accepted 30-second time step and atomically blocks reuse of the same TOTP code.
- **Single-Use Recovery Codes**: 10 recovery codes are generated during activation and stored exclusively as SHA-256 hashes in `MfaRecoveryCode`. Consumption uses an atomic `updateMany({ where: { id, usedAt: null } })` check.
- **Server-Side Enforcement**: `requireRole("ADMIN")`, `requirePermission(...)`, and `requirePageRole("ADMIN", ...)` reject or redirect any admin session where `mfaEnabled === true` and `Session.mfaVerifiedAt === null`.

---

## 2. Authentication & Session Hardening

- **Cookie Security**: `HttpOnly`, `SameSite=Lax`, `Secure` in production (`__Secure-authjs.session-token`).
- **CSRF Protection**: Auth.js built-in CSRF defenses plus `SameSite=Lax` cookies and strict `Content-Type: application/json` API routes.
- **Account Suspension / Disabling**: `setUserAccountStatus()` immediately deletes all active `Session` rows for suspended or disabled accounts, and `findValidDatabaseSession()` rejects any non-`ACTIVE` account.
- **Rate Limiting**:
  - `POST /api/auth/register`: 5 requests / 15 min per IP
  - `POST /api/auth/login`: 10 requests / 15 min per IP + email
  - `POST /api/auth/forgot-password`: 3 requests / 15 min per IP
  - `POST /api/auth/reset-password`: 5 requests / 15 min per IP
  - `POST /api/auth/resend-verification`: 3 requests / 15 min per IP
  - `POST /api/admin/mfa/verify`: 5 requests / 10 min per IP
  - _Note_: The default `InMemoryRateLimiter` is suitable for local development and single-instance testing. Multi-instance production deployments must configure a distributed store (e.g., Redis/Upstash or PostgreSQL).

---

## 3. Security Audit Events (`SecurityAuditEvent`)

Recorded events include: `USER_REGISTERED`, `EMAIL_VERIFIED`, `EMAIL_VERIFICATION_RESENT`, `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_COMPLETED`, `ROLE_CHANGED`, `ACCOUNT_STATUS_CHANGED`, `MFA_ENROLLED`, `MFA_ENROLLMENT_FAILED`, `MFA_VERIFIED`, `MFA_FAILED`, `MFA_REPLAY_BLOCKED`, `RECOVERY_CODE_USED`, `MFA_RECOVERY_CODES_ROTATED`, `MFA_CHALLENGE_REQUIRED`, and `ACCESS_DENIED`.

Passwords, verification/reset tokens, and MFA secrets are never written to audit event metadata.
