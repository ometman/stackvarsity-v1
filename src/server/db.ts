import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { requireServerEnv } from "@/config/server-env";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prismaPool?: Pool;
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const connectionString = requireServerEnv("DATABASE_URL");
  const pool =
    globalForPrisma.prismaPool ??
    new Pool({
      connectionString,
      max: 10,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prismaPool = pool;
  }

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export function getDb(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Verifies PostgreSQL connectivity using a lightweight query.
 */
export async function checkDatabaseConnection(): Promise<{ ok: boolean }> {
  const db = getDb();
  await db.$queryRaw`SELECT 1`;
  return { ok: true };
}
