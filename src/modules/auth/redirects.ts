import type { UserRole } from "@/generated/prisma/enums";

/**
 * Returns the default landing route for each authenticated role.
 */
export function getDefaultDashboardPath(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "INSTRUCTOR":
      return "/instructor";
    case "STUDENT":
    default:
      return "/student";
  }
}

/**
 * Sanitizes a post-login or post-logout redirect path to prevent open-redirect vulnerabilities.
 * Only relative single-slash internal paths (e.g. "/student") are permitted.
 */
export function sanitizeRedirectPath(
  target: string | null | undefined,
  fallback = "/student"
): string {
  if (!target || typeof target !== "string") {
    return fallback;
  }

  const trimmed = target.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }

  // Reject control characters or embedded schemes
  if (/[\r\n\t]/.test(trimmed) || /^\/[^/]*:/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}
