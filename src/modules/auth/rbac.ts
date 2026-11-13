import "server-only";
import type { UserRole } from "@/generated/prisma/enums";
import { recordAuditEvent } from "./audit";
import { ForbiddenError, MfaRequiredError } from "./errors";
import { hasPermission, type Permission } from "./permissions";
import { requireAuth } from "./server-auth";
import type { ValidDatabaseSession } from "./session-repository";

export interface RoleCheckOptions {
  requireAdminMfa?: boolean;
}

/**
 * Enforces that the authenticated user has one of the allowed roles.
 * Also enforces completed MFA when an ADMIN account has MFA enabled (or when explicitly required).
 */
export async function requireRole(
  allowedRoles: UserRole | readonly UserRole[],
  options: RoleCheckOptions = {}
): Promise<ValidDatabaseSession> {
  const session = await requireAuth();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(session.user.role)) {
    await recordAuditEvent({
      actorId: session.user.id,
      targetUserId: session.user.id,
      eventType: "ACCESS_DENIED",
      outcome: "DENIED",
      metadata: { requiredRoles: roles, actualRole: session.user.role },
    });
    throw new ForbiddenError();
  }

  const mustVerifyMfa =
    session.user.role === "ADMIN" && (session.user.mfaEnabled || options.requireAdminMfa);

  if (mustVerifyMfa && session.mfaVerifiedAt === null) {
    await recordAuditEvent({
      actorId: session.user.id,
      targetUserId: session.user.id,
      eventType: "MFA_CHALLENGE_REQUIRED",
      outcome: "DENIED",
    });
    throw new MfaRequiredError();
  }

  return session;
}

/**
 * Enforces that the authenticated user's role grants the specified permission.
 */
export async function requirePermission(permission: Permission): Promise<ValidDatabaseSession> {
  const session = await requireAuth();

  if (!hasPermission(session.user.role, permission)) {
    await recordAuditEvent({
      actorId: session.user.id,
      targetUserId: session.user.id,
      eventType: "ACCESS_DENIED",
      outcome: "DENIED",
      metadata: { requiredPermission: permission, actualRole: session.user.role },
    });
    throw new ForbiddenError();
  }

  if (session.user.role === "ADMIN" && session.user.mfaEnabled && session.mfaVerifiedAt === null) {
    throw new MfaRequiredError();
  }

  return session;
}

export interface ResourceAccessOptions {
  ownerId: string;
  assignedUserIds?: readonly string[];
  allowAdmin?: boolean;
  resourceType?: string;
  resourceId?: string;
}

/**
 * Enforces resource-level ownership or assignment (preventing IDOR).
 */
export async function requireResourceAccess(
  options: ResourceAccessOptions
): Promise<ValidDatabaseSession> {
  const session = await requireAuth();
  const { ownerId, assignedUserIds = [], allowAdmin = false, resourceType, resourceId } = options;

  const isOwner = session.user.id === ownerId;
  const isAssigned = assignedUserIds.includes(session.user.id);
  const isAdminAllowed = allowAdmin && session.user.role === "ADMIN";

  if (isAdminAllowed && session.user.mfaEnabled && session.mfaVerifiedAt === null) {
    throw new MfaRequiredError();
  }

  if (!isOwner && !isAssigned && !isAdminAllowed) {
    await recordAuditEvent({
      actorId: session.user.id,
      targetUserId: ownerId,
      eventType: "ACCESS_DENIED",
      outcome: "DENIED",
      metadata: {
        resourceType: resourceType ?? "unknown",
        resourceId: resourceId ?? "unknown",
      },
    });
    throw new ForbiddenError("You do not have access to this resource");
  }

  return session;
}
