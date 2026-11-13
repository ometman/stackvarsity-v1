import type { UserRole } from "@/generated/prisma/enums";

export const PERMISSIONS = {
  STUDENT_PROFILE_READ_OWN: "student:profile:read_own",
  STUDENT_PROFILE_UPDATE_OWN: "student:profile:update_own",
  STUDENT_COURSES_READ: "student:courses:read",
  INSTRUCTOR_COURSES_MANAGE_ASSIGNED: "instructor:courses:manage_assigned",
  INSTRUCTOR_ASSESSMENTS_MANAGE_ASSIGNED: "instructor:assessments:manage_assigned",
  ADMIN_USERS_READ: "admin:users:read",
  ADMIN_USERS_MANAGE_STATUS: "admin:users:manage_status",
  ADMIN_USERS_MANAGE_ROLES: "admin:users:manage_roles",
  ADMIN_AUDIT_READ: "admin:audit:read",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  STUDENT: [
    PERMISSIONS.STUDENT_PROFILE_READ_OWN,
    PERMISSIONS.STUDENT_PROFILE_UPDATE_OWN,
    PERMISSIONS.STUDENT_COURSES_READ,
  ],
  INSTRUCTOR: [
    PERMISSIONS.STUDENT_PROFILE_READ_OWN,
    PERMISSIONS.STUDENT_COURSES_READ,
    PERMISSIONS.INSTRUCTOR_COURSES_MANAGE_ASSIGNED,
    PERMISSIONS.INSTRUCTOR_ASSESSMENTS_MANAGE_ASSIGNED,
  ],
  ADMIN: Object.values(PERMISSIONS),
};

/**
 * Returns true if the given role holds the requested permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Returns the immutable list of permissions assigned to a role.
 */
export function getPermissionsForRole(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
