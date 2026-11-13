import "server-only";
import { requireResourceAccess } from "@/modules/auth/rbac";
import { getDb } from "@/server/db";

export interface StudentPrivateRecord {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  emailVerified: Date | null;
  createdAt: Date;
}

/**
 * Retrieves a student's private record after verifying resource ownership or ADMIN privilege.
 */
export async function getStudentPrivateRecord(
  studentId: string
): Promise<StudentPrivateRecord | null> {
  await requireResourceAccess({
    ownerId: studentId,
    allowAdmin: true,
    resourceType: "student_record",
    resourceId: studentId,
  });

  const db = getDb();
  return db.user.findFirst({
    where: {
      id: studentId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
    },
  });
}
