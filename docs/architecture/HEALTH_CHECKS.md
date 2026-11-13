# Stack Varsity V1 — Health Checks & Diagnostics

## 1. Endpoints

| Route | Purpose | Success | Failure |
|---|---|---|---|
| `GET /api/health` | Liveness check (app process is serving requests) | `200` (`status: "ok"`) | — |
| `GET /api/ready` | Readiness check (PostgreSQL connectivity via `SELECT 1`, 3s timeout) | `200` (`status: "ok"`) | `503` (`status: "unavailable"`) |

Both endpoints set `Cache-Control: no-store`.

---

## 2. Response Structure

```json
{
  "status": "ok",
  "service": "stackvarsity",
  "timestamp": "2026-11-13T02:20:00.000Z"
}
```

On readiness failure (`GET /api/ready`), HTTP `503` is returned with `"status": "unavailable"`.

---

## 3. Minimal Logging Convention

[src/server/logger.ts](../../src/server/logger.ts) provides a minimal structured JSON logger (`logger.info`, `logger.warn`, `logger.error`) with `level`, `event`, and `timestamp`.

- Never log database connection strings, secrets, tokens, or personal information.
- `GET /api/ready` logs only `error.name` on failure, never raw connection strings or stack traces.

---

## 4. Security & Testing

- **Response Safety**: Endpoints never return `DATABASE_URL`, environment variables, stack traces, or internal error messages.
- **Unit Tests**: [tests/unit/health-endpoints.test.ts](../../tests/unit/health-endpoints.test.ts) verifies `200` and `503` responses, ISO-8601 timestamps, and payload sanitization.
- **Local HTTP Verification**:
  ```powershell
  Invoke-WebRequest http://localhost:3000/api/health
  Invoke-WebRequest http://localhost:3000/api/ready
  ```
