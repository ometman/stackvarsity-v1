import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/server/db";
import { recordAuditEvent } from "./audit";
import { ConflictError, ValidationError } from "./errors";
import { hashPassword } from "./password";
import { registerSchema } from "./registration-schema";
import { issueVerificationTokenAndSendEmail } from "./verification-service";

export interface RegisterContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface RegisteredStudentResult {
  id: string;
  name: string;
  email: string;
  role: "STUDENT";
  createdAt: Date;
}

/**
 * Registers a new student account.
 * Public registration always assigns the STUDENT role and ACTIVE status with unverified email.
 */
export async function registerStudent(
  rawInput: unknown,
  context: RegisterContext = {}
): Promise<RegisteredStudentResult> {
  const parsed = registerSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstMessage = parsed.error.issues[0]?.message ?? "Invalid registration details";
    throw new ValidationError(firstMessage);
  }

  const { name, email, password } = parsed.data;
  const db = getDb();

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError("An account with this email address already exists");
  }

  const passwordHash = await hashPassword(password);

  try {
    const created = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "STUDENT",
        status: "ACTIVE",
        emailVerified: null,
        mfaEnabled: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await recordAuditEvent({
      actorId: created.id,
      targetUserId: created.id,
      eventType: "USER_REGISTERED",
      outcome: "SUCCESS",
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
      metadata: { role: "STUDENT" },
    });

    await issueVerificationTokenAndSendEmail({
      userId: created.id,
      email: created.email,
      name: created.name,
    });

    return {
      id: created.id,
      name: created.name ?? name,
      email: created.email,
      role: "STUDENT",
      createdAt: created.createdAt,
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictError("An account with this email address already exists");
    }
    throw error;
  }
}
