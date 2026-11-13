import "server-only";
import { redirect } from "next/navigation";
import type { UserRole } from "@/generated/prisma/enums";
import { getDefaultDashboardPath } from "./redirects";
import { getCurrentSession } from "./server-auth";
import type { ValidDatabaseSession } from "./session-repository";

/**
 * Server-side page guard for App Router Server Components.
 * Redirects unauthenticated visitors to /login, wrong-role users to their own dashboard,
 * and admins with pending MFA to /admin/mfa.
 */
export async function requirePageRole(
  allowedRoles: UserRole | readonly UserRole[],
  currentPath: string
): Promise<ValidDatabaseSession> {
  const session = await getCurrentSession();

  if (!session) {
    redirect(`/login?next=${encodeURIComponent(currentPath)}`);
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!roles.includes(session.user.role)) {
    redirect(getDefaultDashboardPath(session.user.role));
  }

  if (session.user.role === "ADMIN" && session.user.mfaEnabled && session.mfaVerifiedAt === null) {
    redirect("/admin/mfa");
  }

  return session;
}
