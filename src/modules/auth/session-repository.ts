import "server-only";
import { randomUUID } from "node:crypto";
import type { UserRole, UserStatus } from "@/generated/prisma/enums";
import { getDb } from "@/server/db";

export const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const SHORT_SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export interface AuthenticatedUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: Date | null;
  mfaEnabled: boolean;
}

export interface ValidDatabaseSession {
  id: string;
  sessionToken: string;
  expires: Date;
  mfaVerifiedAt: Date | null;
  user: AuthenticatedUser;
}

export interface CreateSessionInput {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  ttlSeconds?: number;
}

/**
 * Creates a server-persisted session record in PostgreSQL.
 */
export async function createDatabaseSession(input: CreateSessionInput) {
  const db = getDb();
  const ttlSeconds = input.ttlSeconds ?? DEFAULT_SESSION_TTL_SECONDS;
  const expires = new Date(Date.now() + ttlSeconds * 1000);

  return db.session.create({
    data: {
      sessionToken: randomUUID(),
      userId: input.userId,
      expires,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
    select: {
      id: true,
      sessionToken: true,
      expires: true,
    },
  });
}

/**
 * Looks up a non-expired session and verifies the associated user is ACTIVE and not deleted.
 * Never selects or returns passwordHash.
 */
export async function findValidDatabaseSession(
  sessionToken: string
): Promise<ValidDatabaseSession | null> {
  if (!sessionToken) {
    return null;
  }

  const db = getDb();
  const session = await db.session.findUnique({
    where: { sessionToken },
    select: {
      id: true,
      sessionToken: true,
      expires: true,
      mfaVerifiedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          emailVerified: true,
          mfaEnabled: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expires <= new Date()) {
    await db.session.deleteMany({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  if (session.user.deletedAt !== null || session.user.status !== "ACTIVE") {
    return null;
  }

  return {
    id: session.id,
    sessionToken: session.sessionToken,
    expires: session.expires,
    mfaVerifiedAt: session.mfaVerifiedAt,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      status: session.user.status,
      emailVerified: session.user.emailVerified,
      mfaEnabled: session.user.mfaEnabled,
    },
  };
}

/**
 * Revokes a single session by its sessionToken.
 */
export async function revokeDatabaseSession(sessionToken: string): Promise<void> {
  if (!sessionToken) {
    return;
  }
  const db = getDb();
  await db.session.deleteMany({ where: { sessionToken } });
}

/**
 * Revokes all active sessions for a user (e.g., on password reset or suspension).
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  if (!userId) {
    return;
  }
  const db = getDb();
  await db.session.deleteMany({ where: { userId } });
}

/**
 * Marks a session as having completed MFA verification.
 */
export async function markSessionMfaVerified(sessionToken: string): Promise<void> {
  const db = getDb();
  await db.session.updateMany({
    where: { sessionToken },
    data: { mfaVerifiedAt: new Date() },
  });
}
