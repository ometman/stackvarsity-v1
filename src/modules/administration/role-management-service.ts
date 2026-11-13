import "server-only";
import { z } from "zod";
import type { UserRole } from "@/generated/prisma/enums";
import { recordAuditEvent } from "@/modules/auth/audit";
import { ForbiddenError, ValidationError } from "@/modules/auth/errors";
import { PERMISSIONS } from "@/modules/auth/permissions";
import { requirePermission } from "@/modules/auth/rbac";
import { getDb } from "@/server/db";

const changeRoleSchema = z
  .object({
    targetUserId: z.string().trim().min(1, "Target user ID is required"),
    newRole: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]),
    reason: z.string().trim().max(250).optional(),
  })
  .strict();

export interface ChangeRoleContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface ChangeRoleResult {
  userId: string;
  previousRole: UserRole;
  newRole: UserRole;
}

/**
 * Securely updates a user's application role.
 * Requires ADMIN_USERS_MANAGE_ROLES permission, revokes target user sessions, and records an audit event.
 */
export async function changeUserRole(
  rawInput: unknown,
  context: ChangeRoleContext = {}
): Promise<ChangeRoleResult> {
  const actorSession = await requirePermission(PERMISSIONS.ADMIN_USERS_MANAGE_ROLES);

  const parsed = changeRoleSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid role change request");
  }

  const { targetUserId, newRole, reason } = parsed.data;

  if (actorSession.user.id === targetUserId) {
    throw new ForbiddenError("Administrators cannot modify their own role");
  }

  const db = getDb();
  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      role: true,
      deletedAt: true,
    },
  });

  if (!targetUser || targetUser.deletedAt !== null) {
    throw new ValidationError("Target user account was not found");
  }

  if (targetUser.role === newRole) {
    return {
      userId: targetUser.id,
      previousRole: targetUser.role,
      newRole,
    };
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: targetUser.id },
      data: { role: newRole },
    });

    // Invalidate existing sessions so stale role claims are not retained.
    await tx.session.deleteMany({
      where: { userId: targetUser.id },
    });
  });

  await recordAuditEvent({
    actorId: actorSession.user.id,
    targetUserId: targetUser.id,
    eventType: "ROLE_CHANGED",
    outcome: "SUCCESS",
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
    metadata: {
      previousRole: targetUser.role,
      newRole,
      reason: reason ?? null,
    },
  });

  return {
    userId: targetUser.id,
    previousRole: targetUser.role,
    newRole,
  };
}
