import "server-only";
import { z } from "zod";
import type { UserStatus } from "@/generated/prisma/enums";
import { recordAuditEvent } from "@/modules/auth/audit";
import { ForbiddenError, ValidationError } from "@/modules/auth/errors";
import { PERMISSIONS } from "@/modules/auth/permissions";
import { requirePermission } from "@/modules/auth/rbac";
import { getDb } from "@/server/db";

const updateStatusSchema = z
  .object({
    targetUserId: z.string().trim().min(1, "Target user ID is required"),
    status: z.enum(["ACTIVE", "SUSPENDED", "DISABLED"]),
    reason: z.string().trim().max(250).optional(),
  })
  .strict();

export interface AccountStatusContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Updates a user's account status (ACTIVE, SUSPENDED, DISABLED) and immediately
 * revokes all active sessions if the account is suspended or disabled.
 */
export async function setUserAccountStatus(
  rawInput: unknown,
  context: AccountStatusContext = {}
): Promise<{ userId: string; previousStatus: UserStatus; newStatus: UserStatus }> {
  const actorSession = await requirePermission(PERMISSIONS.ADMIN_USERS_MANAGE_STATUS);

  const parsed = updateStatusSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid account status update");
  }

  const { targetUserId, status, reason } = parsed.data;

  if (actorSession.user.id === targetUserId) {
    throw new ForbiddenError("Administrators cannot suspend or disable their own account");
  }

  const db = getDb();
  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, status: true, deletedAt: true },
  });

  if (!targetUser || targetUser.deletedAt !== null) {
    throw new ValidationError("Target user account was not found");
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: targetUser.id },
      data: { status },
    });

    if (status !== "ACTIVE") {
      await tx.session.deleteMany({
        where: { userId: targetUser.id },
      });
    }
  });

  await recordAuditEvent({
    actorId: actorSession.user.id,
    targetUserId: targetUser.id,
    eventType: "ACCOUNT_STATUS_CHANGED",
    outcome: "SUCCESS",
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
    metadata: {
      previousStatus: targetUser.status,
      newStatus: status,
      reason: reason ?? null,
    },
  });

  return {
    userId: targetUser.id,
    previousStatus: targetUser.status,
    newStatus: status,
  };
}
