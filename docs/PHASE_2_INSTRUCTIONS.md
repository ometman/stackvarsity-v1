# STACK VARSITY V1

# PHASE 2 — IDENTITY, AUTHENTICATION & ACCESS CONTROL

## ROLE AND RESPONSIBILITIES

You are the Lead Software Architect, Senior Next.js Engineer, Database Architect, Identity and Access Management Specialist, Application Security Engineer, and Quality Assurance Engineer for Stack Varsity V1.

Your responsibility is to implement Phase 2 of the Stack Varsity development master plan.

You have authorization to implement the entire phase sequentially, including modifying application code, installing necessary dependencies, creating database migrations, running tests, updating documentation, and committing and pushing successfully completed steps to the `development` branch.

You may create a GitHub pull request when appropriate.

Do not merge a pull request into `main` without explicit authorization.

**AUTONOMOUS EXECUTION REQUIREMENT:**

Do not request confirmation after every step.

When a step is completed successfully, committed, and pushed, automatically proceed to the next step.

Stop only when:

- Essential information cannot be obtained or safely inferred.
- User credentials or administrative decisions are required.
- A security-sensitive operation requires authorization.
- An unresolved blocking error prevents safe progression.
- A destructive database or Git operation would be necessary.
- The planned implementation materially conflicts with the master plan.

Do not ask unnecessary questions about routine engineering decisions.

Document noncritical assumptions and continue.

---

# SECTION A — PROJECT CONTEXT

## A.1 Project Identity

Business: Stack Varsity

Tagline: Build • Educate • Innovate

Domain: www.mystackvarsity.com

Email: hello@mystackvarsity.com

Repository: https://github.com/ometman/stackvarsity-v1.git

Active development branch: `development`

Stable branch: `main`

Development environment: Windows, PowerShell, Node.js 24, npm.

## A.2 Application Architecture

The application uses a Next.js Modular Monolith architecture.

Technology stack:

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- PostgreSQL
- Prisma ORM
- Auth.js
- Zod
- React Hook Form
- Vitest
- Playwright
- ESLint
- Prettier

Use the installed compatible versions of these technologies.

Do not add Express, NestJS, or unnecessary backend frameworks.

Keep all application code in the existing repository.

## A.3 Authoritative Documentation

Before implementation, read:

- docs/MASTER_PLAN.md
- docs/architecture/PROJECT_STRUCTURE.md
- docs/architecture/CODING_STANDARDS.md
- docs/architecture/DATABASE.md
- docs/architecture/ENVIRONMENT_CONFIGURATION.md
- docs/architecture/TESTING_STRATEGY.md
- docs/architecture/DESIGN_SYSTEM.md
- docs/PHASE_1_COMPLETION_REPORT.md, if available

The latest approved modular-monolith architecture takes precedence over any obsolete Express or monorepo references.

If documentation is missing, inspect the actual implementation and record the discrepancy.

Do not invent project completion status or validation results.

## A.4 User Roles

Implement three application roles:

**STUDENT**

- Register for an account.
- Log in and manage personal account information.
- Access authorized student resources.
- Access only their own protected information.

**INSTRUCTOR**

- Authenticate securely.
- Access authorized instructor resources.
- Manage only resources assigned to them when those features are introduced.

**ADMIN**

- Authenticate securely with additional security controls.
- Access administrative functionality.
- Manage authorized identities and roles.
- Perform privileged operations only after server-side authorization.

New public registrations must default to STUDENT.

Never allow registration requests to select or assign ADMIN or INSTRUCTOR privileges directly.

Administrative identities and role promotion must use a secure, audited process.

## A.5 Security Principles

Apply:

- Least privilege
- Deny by default
- Secure password hashing
- Server-side authorization
- Resource ownership verification
- Secure session handling
- Protection against account enumeration
- CSRF defenses appropriate to the authentication mechanism
- Secure verification and reset tokens
- Rate limiting
- Audit logging
- Administrator MFA
- Input validation
- Safe error handling
- Security-focused automated testing

Do not trust role information supplied by the browser.

Do not treat route protection as a substitute for authorization inside data-access and business operations.

---

# SECTION B — PHASE 2 EXECUTION PLAN

# STEP 2.1 — IDENTITY ARCHITECTURE AND DATABASE MODELS

## Objective

Design and implement the identity data model that will support authentication, authorization, sessions, email verification, password recovery, and future learning-platform functionality.

## Tasks

### 1. Inspect Current Database

Review:

- Prisma schema
- Existing migrations
- Database configuration
- Existing user models
- Current PostgreSQL connection
- Existing authentication dependencies

Preserve existing data and migrations.

### 2. Design Identity Models

Implement or extend the necessary models for:

- User
- Authentication accounts
- Sessions, where required by the chosen strategy
- Verification tokens
- Password reset tokens
- Roles and permissions
- Security audit events

Prepare for administrator MFA, adding the necessary models in Step 2.9.

Use appropriate unique constraints, indexes, relationships, and timestamps.

### 3. Define User States

Support suitable account states, such as:

- Active
- Suspended
- Disabled

Use verified email state independently from account status.

Do not introduce unnecessary complexity.

### 4. Role Architecture

Define:

- STUDENT
- INSTRUCTOR
- ADMIN

Use a simple, extensible RBAC design.

Choose a role enum or relational role model based on actual application requirements.

Do not create an unnecessarily complex permission-management framework.

### 5. Database Migrations

Create and apply migrations using the installed Prisma version.

Verify that no existing data is lost.

### 6. Documentation

Create or update:

`docs/architecture/IDENTITY_DATA_MODEL.md`

Explain models, relationships, role definitions, and security considerations.

## Acceptance Criteria

- Identity models are implemented.
- Prisma schema validates.
- Migrations succeed.
- Constraints and relationships are correct.
- Existing data remains intact.
- Relevant database tests pass.
- TypeScript and build validation pass.

## Completion Actions

1. Run applicable tests and quality checks.
2. Fix blocking errors.
3. Review changes for security and correctness.
4. Update documentation.
5. Commit with:

`feat(auth): establish identity data models`

6. Push to `origin/development`.
7. Create a PR only if a reviewable milestone warrants one.
8. If successful, automatically proceed to Step 2.2.

---

# STEP 2.2 — AUTHENTICATION INFRASTRUCTURE

## Objective

Integrate Auth.js with the Next.js application and establish secure authentication infrastructure.

## Tasks

### 1. Dependency Review

Inspect installed Next.js, Prisma, and Auth.js versions.

Use compatible packages and configuration patterns.

Do not copy deprecated authentication examples.

### 2. Authentication Configuration

Configure:

- Auth.js
- Prisma integration where appropriate
- Authentication providers
- Session strategy
- Secure cookie handling
- Authentication callbacks
- User identity mapping

If email-and-password authentication is used, ensure the selected credentials flow is compatible with the session strategy and persistence implementation.

Do not assume an adapter automatically persists sessions for every provider.

### 3. Credential Security

Use an established password-hashing algorithm, preferably Argon2id.

Never store plaintext passwords.

Use appropriate password-hashing parameters.

Avoid exposing password hashes through API responses or session objects.

### 4. Session Design

Establish:

- Session creation
- Session expiration
- Session validation
- Session invalidation
- Secure cookie configuration
- Reliable user identity retrieval

Document the selected session architecture and its revocation characteristics.

### 5. Server-Side Authentication Helpers

Create reusable server-only helpers for:

- Retrieving the current session
- Requiring authentication
- Retrieving the authenticated user
- Checking account status
- Rejecting unauthorized requests

Keep authentication internals isolated from client-side code.

### 6. Module Integration

Use the existing:

`src/modules/auth`

Organize implementation into appropriate services, schemas, repositories, and utilities.

### 7. Documentation

Create:

`docs/architecture/AUTHENTICATION.md`

Explain the authentication architecture, providers, session strategy, and security boundaries.

## Acceptance Criteria

- Auth.js is integrated correctly.
- Database integration works.
- Password hashing is secure.
- Session configuration is documented.
- Authentication helpers work.
- No secrets reach the browser.
- Tests and production build pass.

## Completion Actions

1. Validate authentication infrastructure.
2. Execute relevant tests.
3. Update documentation.
4. Commit with:

`feat(auth): integrate secure authentication infrastructure`

5. Push to `origin/development`.
6. Create a PR if appropriate.
7. Automatically proceed to Step 2.3.

---

# STEP 2.3 — USER REGISTRATION

## Objective

Implement secure student registration with appropriate validation and user experience.

## Tasks

### 1. Registration Interface

Create a responsive registration page.

Suggested route:

`/register`

Use the existing design system and shadcn/ui components.

Fields should include:

- Full name
- Email address
- Password
- Password confirmation

Include appropriate error messages, loading states, and accessible form controls.

### 2. Input Validation

Use Zod to validate:

- Required fields
- Email format
- Password requirements
- Password confirmation
- Input lengths

Validate on the server even if client-side validation exists.

### 3. Secure Account Creation

Implement a registration service that:

- Normalizes email addresses consistently.
- Prevents duplicate accounts.
- Hashes passwords securely.
- Creates accounts with the STUDENT role.
- Initializes account verification state.
- Handles concurrent registration attempts safely.

### 4. Privilege Protection

Reject attempts to inject:

- ADMIN role
- INSTRUCTOR role
- Custom permissions
- Verified-account status
- Internal security fields

Do not directly spread untrusted request objects into database creation operations.

### 5. Abuse Protection

Add reasonable registration rate limiting.

Do not rely exclusively on in-memory limits for production security.

### 6. Tests

Test:

- Successful registration
- Invalid input
- Duplicate email
- Weak password
- Concurrent registration attempts
- Role injection
- Password hashing
- Database failures

### 7. Documentation

Document registration behavior and validation rules.

## Acceptance Criteria

- Registration works.
- Passwords are never stored in plaintext.
- Public users receive STUDENT privileges only.
- Server-side validation works.
- Duplicate registration is handled safely.
- UI is responsive and accessible.
- Tests pass.

## Completion Actions

1. Run validation and tests.
2. Resolve errors.
3. Update documentation.
4. Commit with:

`feat(auth): implement secure student registration`

5. Push to `origin/development`.
6. Create a PR if appropriate.
7. Automatically proceed to Step 2.4.

---

# STEP 2.4 — EMAIL VERIFICATION

## Objective

Implement secure email verification to confirm account ownership.

## Tasks

### 1. Verification Token Design

Create cryptographically secure, single-use verification tokens.

Store token hashes rather than plaintext bearer tokens.

Use expiration timestamps.

Ensure successful verification invalidates the token.

Handle concurrent verification requests safely.

### 2. Email Delivery Abstraction

Create a reusable transactional email service.

Support local development without requiring a production email provider.

Use a safe local mail-capture mechanism such as Mailpit when appropriate.

Do not expose verification tokens in browser-visible logs.

Do not hardcode production SMTP credentials.

### 3. Verification Workflow

Implement:

- Verification email generation
- Verification URL handling
- Token validation
- Token expiration
- Successful verification
- Invalid-token handling
- Resend verification

Use generic responses where necessary to prevent account enumeration.

### 4. UI

Create appropriate verification pages and status messages.

Provide clear instructions for:

- Check your email
- Verification successful
- Verification link expired
- Request a new link

### 5. Security

Protect against:

- Token replay
- Token guessing
- Expired-token reuse
- Excessive resend requests
- Unauthorized changes to verified status

### 6. Tests

Test successful and failed verification workflows.

Include expiration, replay, concurrency, and resend abuse scenarios.

## Acceptance Criteria

- Verification works locally.
- Tokens are secure, expiring, and single-use.
- Verified status changes only after valid confirmation.
- Invalid requests do not expose sensitive details.
- Tests pass.

## Completion Actions

1. Validate the workflow.
2. Run automated tests.
3. Update documentation.
4. Commit with:

`feat(auth): implement secure email verification`

5. Push to `origin/development`.
6. Create a PR if appropriate.
7. Automatically proceed to Step 2.5.

---

# STEP 2.5 — LOGIN, LOGOUT AND SESSION MANAGEMENT

## Objective

Implement secure authentication workflows and session lifecycle management.

## Tasks

### 1. Login Interface

Create:

`/login`

Include:

- Email
- Password
- Remember-session behavior only if supported by the chosen strategy
- Forgot-password link
- Registration link
- Loading states
- Accessible error messages

### 2. Login Service

Verify credentials securely.

Reject suspended or disabled accounts.

Apply the agreed email-verification policy.

Use generic authentication errors to reduce account enumeration.

### 3. Session Handling

Implement:

- Session creation
- Session expiration
- Session validation
- Logout
- Session invalidation
- Safe post-login redirects

Prevent open-redirect vulnerabilities.

### 4. Navigation

Update the application navigation to reflect authentication state.

Authenticated users should see appropriate account options.

Unauthenticated visitors should see registration and login options.

### 5. Security

Implement reasonable login attempt controls.

Ensure authentication cookies have appropriate security attributes.

Do not store authentication secrets in localStorage.

### 6. Tests

Test:

- Successful login
- Incorrect credentials
- Unknown accounts
- Disabled accounts
- Unverified accounts
- Logout
- Session expiration
- Redirect handling
- Session invalidation

## Acceptance Criteria

- Login works.
- Logout invalidates the relevant session.
- Unauthorized users cannot access protected functionality.
- Authentication state is handled consistently.
- Security tests pass.

## Completion Actions

1. Run login and session tests.
2. Resolve errors.
3. Update documentation.
4. Commit with:

`feat(auth): implement login logout and session management`

5. Push to `origin/development`.
6. Create a PR if appropriate.
7. Automatically proceed to Step 2.6.

---

# STEP 2.6 — PASSWORD RECOVERY

## Objective

Implement secure password reset functionality.

## Tasks

### 1. Forgot-Password Page

Create:

`/forgot-password`

Allow users to request a password reset through their registered email address.

Return generic confirmation messages.

### 2. Reset Tokens

Generate cryptographically secure reset tokens.

Store token hashes.

Enforce expiration and single-use behavior.

### 3. Reset-Password Page

Create an appropriate reset route.

Validate:

- Reset token
- New password
- Password confirmation

### 4. Password Update

Securely hash the new password.

Consume the reset token atomically.

Invalidate existing sessions according to the selected session strategy.

Do not automatically authenticate users merely because they possess a reset token.

### 5. Notifications

Send a password-change notification when practical.

Never include the new password in an email.

### 6. Abuse Protection

Apply rate limiting to password-reset requests.

Prevent account enumeration.

### 7. Tests

Test:

- Valid reset
- Invalid token
- Expired token
- Reused token
- Concurrent reset attempts
- Weak password
- Unknown email
- Session invalidation

## Acceptance Criteria

- Password reset works end to end.
- Tokens cannot be reused.
- Passwords are securely hashed.
- Existing sessions are invalidated as intended.
- Account existence is not disclosed.
- Tests pass.

## Completion Actions

1. Validate password recovery.
2. Execute security tests.
3. Update documentation.
4. Commit with:

`feat(auth): implement secure password recovery`

5. Push to `origin/development`.
6. Create a PR if appropriate.
7. Automatically proceed to Step 2.7.

---

# STEP 2.7 — ROLE-BASED ACCESS CONTROL

## Objective

Implement centralized authorization for students, instructors, and administrators.

## Tasks

### 1. Permission Design

Define an authorization matrix for:

- Public visitors
- Students
- Instructors
- Administrators

Document allowed and denied operations.

### 2. Authorization Helpers

Implement reusable helpers such as:

- requireAuth
- requireRole
- requirePermission
- requireResourceAccess

Use naming conventions compatible with the existing project.

Authorization must use trusted server-side identity and persisted account state.

### 3. Default Permissions

Follow least-privilege principles.

Never grant administrative privileges during public registration.

### 4. Role Management

Provide a secure service for authorized role changes.

Do not expose an unrestricted role-update API.

Include audit logging for privileged role changes.

### 5. Server-Side Enforcement

Apply authorization within:

- Business services
- Route Handlers
- Server Actions
- Data-access operations where applicable

Do not rely only on hidden buttons, navigation menus, or client-side role checks.

### 6. Tests

Test:

- Student permissions
- Instructor permissions
- Administrator permissions
- Unauthorized access
- Privilege escalation
- Role changes
- Disabled accounts
- Missing sessions

## Acceptance Criteria

- Roles are implemented correctly.
- Authorization is centralized.
- Privilege escalation attempts are rejected.
- Sensitive operations require server-side authorization.
- Tests pass.

## Completion Actions

1. Validate the permission matrix.
2. Run authorization tests.
3. Update documentation.
4. Commit with:

`feat(auth): implement role based access control`

5. Push to `origin/development`.
6. Create a PR if appropriate.
7. Automatically proceed to Step 2.8.

---

# STEP 2.8 — PROTECTED ROUTES AND RESOURCE AUTHORIZATION

## Objective

Protect authenticated application areas and enforce resource ownership.

## Tasks

### 1. Protected Routes

Prepare protected route groups for:

- Student
- Instructor
- Administrator

Use the existing Next.js App Router conventions.

Remember that route-group names do not automatically become URL segments.

### 2. Access Enforcement

Ensure unauthenticated users cannot retrieve protected information.

Use server-side authorization checks.

Redirect browser navigation where appropriate.

Return suitable HTTP errors for unauthorized API requests.

### 3. Resource Ownership

Create reusable authorization patterns for checking whether a user owns or is assigned a resource.

For example:

- A student must not access another student's private records.
- An instructor must not access another instructor's restricted records.
- Administrative access must require appropriate privileges.

Do not create complete LMS functionality in this step.

Use minimal representative resources or fixtures to validate the authorization patterns.

### 4. API Protection

Protect relevant Route Handlers and Server Actions.

Prevent insecure direct object reference vulnerabilities.

### 5. Minimal Dashboards

Create simple protected dashboard entry pages for:

- Students
- Instructors
- Administrators

These are authentication verification interfaces, not final dashboards.

### 6. Tests

Test:

- Unauthenticated access
- Wrong-role access
- Authorized access
- Cross-user resource access
- Direct API requests
- Direct URL navigation
- Session expiration

## Acceptance Criteria

- Protected routes are enforced.
- APIs verify authorization independently.
- Resource ownership restrictions work.
- Users cannot access unauthorized records.
- Tests pass.

## Completion Actions

1. Validate protected routes.
2. Run resource authorization tests.
3. Update documentation.
4. Commit with:

`feat(auth): secure protected routes and resource access`

5. Push to `origin/development`.
6. Create a PR if appropriate.
7. Automatically proceed to Step 2.9.

---

# STEP 2.9 — ADMINISTRATOR MFA AND SECURITY HARDENING

## Objective

Implement additional safeguards for administrator accounts and harden the authentication system.

## Tasks

### 1. Administrator MFA

Implement TOTP-based multifactor authentication for administrators.

Use established, maintained cryptographic libraries.

Do not invent custom cryptographic algorithms.

### 2. MFA Enrollment

Implement:

- Authenticated MFA enrollment
- TOTP secret generation
- QR-code provisioning
- TOTP verification
- MFA activation

Require appropriate verification before activating MFA.

### 3. Recovery Codes

Generate single-use recovery codes.

Store hashes of recovery codes.

Display plaintext recovery codes only during secure issuance.

Allow recovery-code rotation through an authenticated and appropriately verified workflow.

### 4. Privileged Access

Require MFA verification before granting full administrator access.

An administrator who has passed only the password step must not be able to access privileged administrative operations.

Enforce this on the server.

### 5. Authentication Hardening

Review and strengthen:

- Login rate limiting
- Registration rate limiting
- Password reset rate limiting
- Email verification abuse prevention
- Session expiration
- Session revocation
- Account suspension handling
- Authentication redirects
- Cookie security
- CSRF protections
- Security audit logging

Use a rate-limiting mechanism suitable for the application's intended production runtime.

A process-local memory limiter may be used for local development or testing but must not be represented as sufficient distributed production protection.

### 6. Audit Events

Record significant security actions, including:

- Administrative role changes
- MFA enrollment
- MFA removal
- Account suspension
- Sensitive account recovery
- Repeated suspicious authentication failures

Avoid recording passwords, tokens, or MFA secrets.

### 7. Tests

Test:

- MFA enrollment
- Valid TOTP
- Invalid TOTP
- Expired or replayed TOTP
- Recovery code use
- Recovery code replay
- Administrator access without MFA
- MFA bypass attempts
- Rate limiting
- Suspended-account access

## Acceptance Criteria

- Administrator MFA works.
- Privileged operations require completed MFA.
- Recovery codes are single-use.
- Sensitive actions are audited.
- Rate limiting is effective in the tested environment.
- Security tests pass.

## Completion Actions

1. Run authentication security tests.
2. Resolve blocking vulnerabilities.
3. Update security documentation.
4. Commit with:

`feat(security): implement administrator MFA and auth hardening`

5. Push to `origin/development`.
6. Create a PR if appropriate.
7. Automatically proceed to Step 2.10.

---

# STEP 2.10 — PHASE 2 TESTING, SECURITY AUDIT AND COMPLETION

## Objective

Conduct comprehensive validation of the entire identity and authentication system.

## Tasks

### 1. Functional Testing

Validate:

- Registration
- Email verification
- Login
- Logout
- Session management
- Password reset
- Role-based authorization
- Protected routes
- Resource ownership
- Administrator MFA

### 2. Security Testing

Test:

- SQL injection resistance
- Input validation
- Account enumeration
- Brute-force controls
- Session hijacking mitigations
- Session fixation protections
- CSRF defenses
- Token replay protection
- Privilege escalation
- Unauthorized resource access
- MFA bypass attempts
- Secret exposure

Do not report a control as verified unless it has been examined or tested.

### 3. Automated Tests

Run:

- Unit tests
- Integration tests
- Authentication component tests
- Playwright end-to-end tests

Use isolated test data and database resources.

### 4. Quality Checks

Run available project commands, including:

- npm run typecheck
- npm run lint
- npm run format:check
- npm run validate
- npm run build
- Appropriate npm test commands

Use the actual script names found in package.json.

### 5. Database Review

Verify:

- Migration history
- Identity relationships
- Unique constraints
- Token storage
- Password storage
- Session persistence
- Privileged account protections

### 6. Security Review

Review dependencies for known vulnerabilities.

Classify findings by severity.

Do not blindly apply force-upgrades that could break framework compatibility.

### 7. Documentation

Create:

`docs/PHASE_2_COMPLETION_REPORT.md`

Include:

- Executive summary
- Completed steps
- Architecture changes
- Database models
- Authentication configuration
- User-facing authentication routes
- Authorization matrix
- Administrator MFA implementation
- Security controls
- Test results
- Build results
- Dependency audit results
- Known limitations
- Outstanding issues
- Recommendations for Phase 3

### 8. Phase Acceptance

Assign one of the following outcomes:

**PASS**

All required functionality and security controls are implemented and validated. No unresolved release-blocking issues remain.

**CONDITIONAL PASS**

Core functionality passes, with explicitly documented nonblocking limitations.

**FAIL**

Material implementation, authorization, or security requirements are unresolved.

A conditional pass must not be treated as authorization to release insecure functionality to production.

### 9. Pull Request

After successfully completing Phase 2:

- Confirm all Step 2.1–2.10 changes are committed.
- Confirm all completed commits are pushed to `development`.
- Review the Git diff against `main`.
- Create one Phase 2 pull request from `development` into `main` if the milestone is ready for review.
- Include the implementation summary, tests, security considerations, and relevant completion report.
- Do not create duplicate PRs.
- Do not automatically merge the PR.
- Do not deploy to production.

If GitHub PR creation is unavailable, provide the exact manual PR instructions and proposed PR description.

## Completion Actions

1. Execute the complete Phase 2 validation suite.
2. Resolve all release-blocking issues.
3. Update project documentation.
4. Commit with:

`chore: complete phase 2 identity and access validation`

5. Push to `origin/development`.
6. Create or update the Phase 2 PR when appropriate.
7. Produce the final completion report.
8. Stop after Phase 2.

Do not begin Phase 3 without further authorization.

---

# SECTION C — AUTOMATED STEP EXECUTION PROTOCOL

This protocol applies to every step in Phase 2.

## C.1 Before Starting a Step

1. Confirm the active branch is `development`.
2. Inspect the Git working tree.
3. Inspect existing implementation.
4. Review dependencies and relevant documentation.
5. Identify the precise scope of the step.
6. Preserve unrelated changes.
7. Confirm no unresolved blocking issues exist.

If uncommitted changes are present, determine whether they belong to the current task before proceeding.

Never discard unrelated user changes.

## C.2 During Implementation

- Follow the established architecture.
- Use existing components and utilities where possible.
- Avoid duplicate functionality.
- Write maintainable TypeScript.
- Keep server-only operations on the server.
- Add tests alongside implementation.
- Apply secure defaults.
- Document important decisions.

## C.3 Error Resolution

When an error occurs:

1. Investigate the cause.
2. Determine its severity.
3. Attempt a safe correction.
4. Rerun the affected checks.
5. Record the resolution.

Continue automatically if the issue is resolved.

Stop only when an unresolved issue genuinely blocks safe progression.

Do not hide test failures, suppress security errors, or disable checks to obtain a passing result.

## C.4 Step Completion Checklist

Every step must finish with:

- Implementation complete.
- Relevant tests passing.
- TypeScript validation passing.
- ESLint passing.
- Formatting validation passing.
- Production build passing where applicable.
- Security review completed.
- Documentation updated.
- Git changes reviewed.
- Step committed.
- Commit pushed to `origin/development`.

If these conditions cannot be met, do not mark the step complete.

Do not push known release-blocking defects merely to satisfy the workflow.

## C.5 Commit and Push

Use conventional commits.

Example:

```powershell
git add .
git commit -m "feat(auth): implement secure student registration"
git push origin development
```

Review staged changes before committing.

Ensure no secrets, generated artifacts, or unrelated files are included.

## C.6 Pull Request Policy

A pull request is optional for individual steps.

Prefer one comprehensive PR for Phase 2 unless the existing repository workflow requires smaller PRs.

If a PR already exists, update it rather than creating duplicates.

Do not merge automatically.

## C.7 Automatic Progression

After a successful step:

1. Record completion.
2. Commit and push.
3. Report a concise summary.
4. Begin the next step immediately.

No user confirmation is required for routine progression.

If a blocking issue requires user input:

1. State the exact blocker.
2. Explain why automatic resolution is unsafe or impossible.
3. Explain the required decision or input.
4. Preserve the current working state.
5. Stop until the blocker is resolved.

Do not invent credentials or bypass security controls.

---

# SECTION D — FINAL PHASE 2 DELIVERABLES

At the end of Phase 2, the repository must contain:

## Functional Deliverables

- Secure student registration
- Secure login and logout
- Email verification
- Password reset
- Session management
- Role-based access control
- Protected application routes
- Resource authorization
- Administrator MFA
- Authentication rate limiting
- Security audit logging

## Technical Deliverables

- Identity database schema
- Prisma migrations
- Authentication services
- Authorization utilities
- Authentication Route Handlers
- Authentication UI components
- Automated authentication tests
- Relevant security tests

## Documentation Deliverables

- Identity data model documentation
- Authentication architecture documentation
- Authorization matrix
- Authentication environment configuration
- Administrator MFA documentation
- Security controls documentation
- Phase 2 completion report

## Git Deliverables

- Separate commits for completed steps
- All successful changes pushed to `development`
- Phase 2 pull request when appropriate
- No unauthorized merge into `main`

---

# SECTION E — FINAL SUCCESS CRITERIA

Phase 2 is successfully completed only when:

1. A new student can register securely.
2. Email ownership can be verified.
3. A verified, active student can log in.
4. Logout invalidates the relevant session.
5. Password recovery works securely.
6. Unauthorized visitors cannot access protected resources.
7. Students cannot access other students' private records.
8. Instructors cannot exceed their assigned permissions.
9. Administrative actions require authorization.
10. Administrator MFA is correctly enforced.
11. Privilege escalation attempts are rejected.
12. Authentication security tests pass.
13. Database migrations are valid.
14. TypeScript, ESLint, and build checks pass.
15. No unresolved critical or high-severity security findings remain.
16. Documentation reflects the implemented architecture.
17. All completed changes are committed and pushed.
18. The final Phase 2 report is generated.

**FINAL EXECUTION INSTRUCTION**

Begin with Step 2.1.

Proceed through the steps sequentially.

Do not request confirmation between successful steps.

At the end of each step, validate, commit, and push, creating or updating a PR when appropriate.

Continue automatically unless a genuine blocker, security issue, destructive operation, or required user decision prevents safe execution.

Stop after completing Step 2.10 and presenting the Phase 2 completion report.
