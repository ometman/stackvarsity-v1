import "server-only";
import { auth } from "./auth";
import { UnauthorizedError } from "./errors";
import {
  findValidDatabaseSession,
  type AuthenticatedUser,
  type ValidDatabaseSession,
} from "./session-repository";

/**
 * Retrieves the current server-validated session from PostgreSQL.
 * Returns null if unauthenticated, expired, revoked, or if the user is not ACTIVE.
 */
export async function getCurrentSession(): Promise<ValidDatabaseSession | null> {
  const session = await auth();
  const sessionToken = session?.sessionToken;

  if (!sessionToken) {
    return null;
  }

  return findValidDatabaseSession(sessionToken);
}

/**
 * Retrieves the currently authenticated and active user, or null.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

/**
 * Requires an active, authenticated session. Throws UnauthorizedError otherwise.
 */
export async function requireAuth(): Promise<ValidDatabaseSession> {
  const session = await getCurrentSession();
  if (!session) {
    throw new UnauthorizedError();
  }
  return session;
}

/**
 * Requires an active authenticated user and returns the user projection.
 */
export async function requireActiveUser(): Promise<AuthenticatedUser> {
  const session = await requireAuth();
  return session.user;
}
