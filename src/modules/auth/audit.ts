import "server-only";
import type { AuditOutcome, Prisma } from "@/generated/prisma/client";
import { getDb } from "@/server/db";
import { logger } from "@/server/logger";

export interface RecordAuditEventInput {
  actorId?: string | null;
  targetUserId?: string | null;
  eventType: string;
  outcome?: AuditOutcome;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Records a security audit event in PostgreSQL.
 * Never store passwords, plaintext tokens, or MFA secrets in metadata.
 */
export async function recordAuditEvent(input: RecordAuditEventInput): Promise<void> {
  try {
    const db = getDb();
    await db.securityAuditEvent.create({
      data: {
        actorId: input.actorId ?? null,
        targetUserId: input.targetUserId ?? null,
        eventType: input.eventType,
        outcome: input.outcome ?? "SUCCESS",
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    logger.error("Failed to record security audit event", {
      eventType: input.eventType,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
