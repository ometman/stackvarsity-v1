import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetCurrentSession } = vi.hoisted(() => ({
  mockGetCurrentSession: vi.fn(),
}));

const mockUserFindUnique = vi.fn();
const mockUserUpdate = vi.fn();
const mockSessionDeleteMany = vi.fn();
const mockAuditCreate = vi.fn();

const mockTx = {
  user: { update: mockUserUpdate },
  session: { deleteMany: mockSessionDeleteMany },
};

vi.mock("@/modules/auth/server-auth", () => ({
  getCurrentSession: mockGetCurrentSession,
  requireAuth: async () => {
    const session = await mockGetCurrentSession();
    if (!session) {
      const { UnauthorizedError } = await import("@/modules/auth/errors");
      throw new UnauthorizedError();
    }
    return session;
  },
}));

vi.mock("@/server/db", () => ({
  getDb: () => ({
    user: {
      findUnique: mockUserFindUnique,
      update: mockUserUpdate,
    },
    session: {
      deleteMany: mockSessionDeleteMany,
    },
    securityAuditEvent: {
      create: mockAuditCreate,
    },
    $transaction: async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
  }),
}));

import { changeUserRole } from "@/modules/administration/role-management-service";
import { ForbiddenError, MfaRequiredError, UnauthorizedError } from "@/modules/auth/errors";
import { hasPermission, PERMISSIONS } from "@/modules/auth/permissions";
import { requirePermission, requireResourceAccess, requireRole } from "@/modules/auth/rbac";

function makeSession(
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN",
  overrides: Partial<{ id: string; mfaEnabled: boolean; mfaVerifiedAt: Date | null }> = {}
) {
  return {
    id: "sess_1",
    sessionToken: "tok_1",
    expires: new Date(Date.now() + 60_000),
    mfaVerifiedAt: overrides.mfaVerifiedAt ?? null,
    user: {
      id: overrides.id ?? "user_1",
      name: "Test User",
      email: "user@example.com",
      role,
      status: "ACTIVE" as const,
      emailVerified: new Date(),
      mfaEnabled: overrides.mfaEnabled ?? false,
    },
  };
}

describe("Role-Based Access Control (RBAC)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enforces permission matrix for STUDENT, INSTRUCTOR, and ADMIN", () => {
    expect(hasPermission("STUDENT", PERMISSIONS.STUDENT_PROFILE_READ_OWN)).toBe(true);
    expect(hasPermission("STUDENT", PERMISSIONS.INSTRUCTOR_COURSES_MANAGE_ASSIGNED)).toBe(false);
    expect(hasPermission("STUDENT", PERMISSIONS.ADMIN_USERS_MANAGE_ROLES)).toBe(false);

    expect(hasPermission("INSTRUCTOR", PERMISSIONS.INSTRUCTOR_COURSES_MANAGE_ASSIGNED)).toBe(true);
    expect(hasPermission("INSTRUCTOR", PERMISSIONS.ADMIN_USERS_MANAGE_ROLES)).toBe(false);

    expect(hasPermission("ADMIN", PERMISSIONS.ADMIN_USERS_MANAGE_ROLES)).toBe(true);
    expect(hasPermission("ADMIN", PERMISSIONS.ADMIN_AUDIT_READ)).toBe(true);
  });

  it("rejects missing sessions with UnauthorizedError", async () => {
    mockGetCurrentSession.mockResolvedValueOnce(null);
    await expect(requireRole("STUDENT")).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("rejects wrong-role access and privilege escalation attempts", async () => {
    mockGetCurrentSession.mockResolvedValue(makeSession("STUDENT", { id: "student_1" }));

    await expect(requireRole("ADMIN")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(requirePermission(PERMISSIONS.ADMIN_USERS_MANAGE_ROLES)).rejects.toBeInstanceOf(
      ForbiddenError
    );
    await expect(
      changeUserRole({ targetUserId: "student_1", newRole: "ADMIN" })
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("enforces MFA for ADMIN sessions when MFA is enabled", async () => {
    mockGetCurrentSession.mockResolvedValueOnce(
      makeSession("ADMIN", { id: "admin_1", mfaEnabled: true, mfaVerifiedAt: null })
    );
    await expect(requireRole("ADMIN")).rejects.toBeInstanceOf(MfaRequiredError);

    mockGetCurrentSession.mockResolvedValueOnce(
      makeSession("ADMIN", { id: "admin_1", mfaEnabled: true, mfaVerifiedAt: new Date() })
    );
    const verified = await requireRole("ADMIN");
    expect(verified.user.role).toBe("ADMIN");
  });

  it("allows ADMIN to change another user's role, revokes sessions, and blocks self-change", async () => {
    mockGetCurrentSession.mockResolvedValue(
      makeSession("ADMIN", { id: "admin_1", mfaEnabled: true, mfaVerifiedAt: new Date() })
    );

    await expect(
      changeUserRole({ targetUserId: "admin_1", newRole: "STUDENT" })
    ).rejects.toBeInstanceOf(ForbiddenError);

    mockUserFindUnique.mockResolvedValueOnce({
      id: "user_2",
      role: "STUDENT",
      deletedAt: null,
    });

    const result = await changeUserRole({
      targetUserId: "user_2",
      newRole: "INSTRUCTOR",
      reason: "Approved instructor onboarding",
    });

    expect(result).toEqual({
      userId: "user_2",
      previousRole: "STUDENT",
      newRole: "INSTRUCTOR",
    });
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: "user_2" },
      data: { role: "INSTRUCTOR" },
    });
    expect(mockSessionDeleteMany).toHaveBeenCalledWith({
      where: { userId: "user_2" },
    });
    expect(mockAuditCreate).toHaveBeenCalledTimes(1);
  });

  it("enforces resource ownership and assigned access in requireResourceAccess", async () => {
    mockGetCurrentSession.mockResolvedValueOnce(makeSession("STUDENT", { id: "s1" }));
    await expect(
      requireResourceAccess({ ownerId: "s2", resourceType: "student_note", resourceId: "n1" })
    ).rejects.toBeInstanceOf(ForbiddenError);

    mockGetCurrentSession.mockResolvedValueOnce(makeSession("INSTRUCTOR", { id: "inst_1" }));
    await expect(
      requireResourceAccess({
        ownerId: "admin_1",
        assignedUserIds: ["inst_1"],
        resourceType: "course",
        resourceId: "c1",
      })
    ).resolves.toBeDefined();
  });
});
