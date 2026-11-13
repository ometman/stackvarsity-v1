# Stack Varsity V1 — Database Architecture (PostgreSQL & Prisma)

## 1. Local PostgreSQL Setup

Stack Varsity V1 uses **PostgreSQL** as its primary relational database. Local development supports either:

1. **Local Windows / Native PostgreSQL** (e.g. `postgresql-x64-18` service):
   - Ensure the PostgreSQL service is running and a `stackvarsity_dev` database exists.
2. **Docker Compose** ([infra/docker/docker-compose.yml](../../infra/docker/docker-compose.yml)):
   ```powershell
   docker compose -f infra/docker/docker-compose.yml up -d
   ```

---

## 2. Connection Configuration

1. Copy [.env.example](../../.env.example) to `.env.local`.
2. Set `DATABASE_URL` in `.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stackvarsity_dev?schema=public"
   ```
3. Never commit `.env.local` or real database credentials to Git.

---

## 3. Prisma 7 Configuration & Access

- **Prisma Config**: [prisma.config.ts](../../prisma.config.ts) configures schema path (`prisma/schema.prisma`), migrations directory (`prisma/migrations`), and `DATABASE_URL`.
- **Schema & Client Output**: [prisma/schema.prisma](../../prisma/schema.prisma) uses the `prisma-client` generator outputting to `src/generated/prisma`.
- **Server-Only Client**: [src/server/db.ts](../../src/server/db.ts) uses `@prisma/adapter-pg` with `pg.Pool`, `import "server-only"`, and a `globalThis` singleton in development to avoid exhausting connections during HMR. Browser/Client Components must never import `src/server/db.ts` or Prisma directly.

---

## 4. Schema Conventions

- **Primary Keys**: `String @id @default(cuid())` (or `@default(uuid())` where external UUIDs are required).
- **Table & Column Naming**: `snake_case` in PostgreSQL via `@@map` / `@map`, `camelCase` in TypeScript/Prisma models.
- **Timestamps**: `createdAt DateTime @default(now()) @map("created_at")` and `updatedAt DateTime @updatedAt @map("updated_at")` on persistent entities.
- **Foreign Keys & Indexes**: Explicit foreign-key relations with `@@index([...])` on foreign keys and frequently queried columns, and `@unique` / `@@unique` for natural keys.
- **Soft Deletion**: Use `deletedAt DateTime? @map("deleted_at")` only where auditability/recovery justifies it.
- **Transactions**: Use `db.$transaction(...)` for multi-write invariants (enrollments, payments, exam submissions).
- **Migration Naming**: Descriptive snake_case names (e.g. `npx prisma migrate dev --name init_health_check`).

---

## 5. Prisma Workflow & Scripts

| Command                     | Purpose                                            |
| --------------------------- | -------------------------------------------------- |
| `npm run db:validate`       | Validate `prisma/schema.prisma` syntax and config  |
| `npm run db:generate`       | Generate Prisma Client into `src/generated/prisma` |
| `npm run db:migrate`        | Create and apply development migrations            |
| `npm run db:migrate:status` | Inspect migration status against the database      |
| `npm run db:studio`         | Open Prisma Studio for local data inspection       |

---

## 6. Security Rules & Troubleshooting

- **Security**: Keep database access strictly on the server (`src/server/` or server-side module repositories). Validate all inputs with Zod before persistence. Never run destructive commands (`prisma migrate reset`, `--force-reset`) without explicit authorization.
- **Troubleshooting**:
  - _Connection refused (`ECONNREFUSED`)_: Verify `postgresql-x64-18` service or Docker container is running on port `5432`.
  - _Prisma Client import errors_: Run `npm run db:generate`.
