# Stack Varsity V1 — Authorization Matrix

## 1. Roles

- **Public Visitor**: Unauthenticated user.
- **`STUDENT`**: Default role for all public registrations.
- **`INSTRUCTOR`**: Content author / facilitator assigned to specific courses/assessments.
- **`ADMIN`**: Platform administrator with privileged management capabilities (MFA-gated).

---

## 2. Permission Matrix

| Operation / Resource                                                                       | Public | STUDENT     | INSTRUCTOR       | ADMIN                 |
| ------------------------------------------------------------------------------------------ | ------ | ----------- | ---------------- | --------------------- |
| Public pages, `/login`, `/register`, `/forgot-password`, `/verify-email`                   | Allow  | Allow       | Allow            | Allow                 |
| Read/update own student profile (`student:profile:read_own`, `student:profile:update_own`) | Deny   | Allow (own) | Read (own)       | Allow                 |
| Read another student's private records                                                     | Deny   | Deny        | Deny             | Allow (audited + MFA) |
| Manage assigned courses/assessments (`instructor:courses:manage_assigned`)                 | Deny   | Deny        | Allow (assigned) | Allow                 |
| Manage unassigned instructor resources                                                     | Deny   | Deny        | Deny             | Allow                 |
| View users & audit logs (`admin:users:read`, `admin:audit:read`)                           | Deny   | Deny        | Deny             | Allow (MFA)           |
| Change user roles / status (`admin:users:manage_roles`, `admin:users:manage_status`)       | Deny   | Deny        | Deny             | Allow (MFA, non-self) |

---

## 3. Server-Side Enforcement Helpers

All authorization checks run on the server using trusted PostgreSQL `Session` and `User` state:

- `requireAuth()` — Verifies active session and `User.status === "ACTIVE"`.
- `requireRole(roles, options)` — Verifies role membership and enforces Admin MFA when enabled/required.
- `requirePermission(permission)` — Verifies role-permission grant and enforces Admin MFA.
- `requireResourceAccess({ ownerId, assignedUserIds, allowAdmin })` — Enforces resource ownership/assignment to prevent IDOR.

---

## 4. Protected Routes & Resource Ownership

- **Protected App Routes**:
  - `/student` (`src/app/(student)/student/page.tsx`) — Requires `STUDENT` or `ADMIN`.
  - `/instructor` (`src/app/(instructor)/instructor/page.tsx`) — Requires `INSTRUCTOR` or `ADMIN`.
  - `/admin` (`src/app/(admin)/admin/page.tsx`) — Requires `ADMIN` (plus completed MFA when enabled).
- **Protected API Endpoints**:
  - `GET /api/students/[studentId]/record` — Enforces `requireResourceAccess({ ownerId: studentId, allowAdmin: true })` to prevent Insecure Direct Object Reference (IDOR).
  - `GET /api/instructor/courses` — Enforces `requireRole(["INSTRUCTOR", "ADMIN"])`.
  - `GET /api/admin/audit-events` — Enforces `requirePermission(PERMISSIONS.ADMIN_AUDIT_READ)`.
  - `PATCH /api/admin/users/[userId]/role` — Enforces `requirePermission(PERMISSIONS.ADMIN_USERS_MANAGE_ROLES)`.
