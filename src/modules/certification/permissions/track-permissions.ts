import "server-only";
import { recordAuditEvent } from "@/modules/auth/audit";
import { ForbiddenError } from "@/modules/auth/errors";
import { requireRole } from "@/modules/auth/rbac";
import type { ValidDatabaseSession } from "@/modules/auth/session-repository";
import { getDb } from "@/server/db";

export async function requireTrackEditor(trackId: string): Promise<ValidDatabaseSession> {
  const session = await requireRole(["INSTRUCTOR", "ADMIN"]);
  if (session.user.role === "ADMIN") {
    return session;
  }

  const db = getDb();
  const assignment = await db.trackAssignment.findFirst({
    where: {
      trackId,
      userId: session.user.id,
      role: "AUTHOR",
    },
    select: { id: true },
  });

  if (!assignment) {
    await recordAuditEvent({
      actorId: session.user.id,
      eventType: "CERTIFICATION_ACCESS_DENIED",
      outcome: "DENIED",
      metadata: { trackId, requiredScope: "AUTHOR" },
    });
    throw new ForbiddenError("You are not assigned to edit this preparation track");
  }

  return session;
}

export async function requireTrackReviewer(trackId: string): Promise<ValidDatabaseSession> {
  const session = await requireRole(["INSTRUCTOR", "ADMIN"]);
  if (session.user.role === "ADMIN") {
    return session;
  }

  const db = getDb();
  const assignment = await db.trackAssignment.findFirst({
    where: {
      trackId,
      userId: session.user.id,
      role: "REVIEWER",
    },
    select: { id: true },
  });

  if (!assignment) {
    await recordAuditEvent({
      actorId: session.user.id,
      eventType: "CERTIFICATION_ACCESS_DENIED",
      outcome: "DENIED",
      metadata: { trackId, requiredScope: "REVIEWER" },
    });
    throw new ForbiddenError("You are not assigned to review this preparation track");
  }

  return session;
}
