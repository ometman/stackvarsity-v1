import "server-only";
import { z } from "zod";
import { getDb } from "@/server/db";
import { getAppBaseUrl, sendTransactionalEmail } from "@/server/mail";
import { recordAuditEvent } from "./audit";
import { ValidationError } from "./errors";
import { normalizeEmail } from "./schemas";
import { generateOpaqueToken, hashToken } from "./tokens";

export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const verifyTokenSchema = z.object({
  token: z.string().trim().min(16, "Verification token is invalid").max(256),
});

const resendSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .max(254)
    .email("Please enter a valid email address")
    .transform(normalizeEmail),
});

export interface VerificationContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Generates a single-use verification token, stores its SHA-256 hash, and sends the verification email.
 */
export async function issueVerificationTokenAndSendEmail(params: {
  userId: string;
  email: string;
  name?: string | null;
}): Promise<void> {
  const db = getDb();
  const rawToken = generateOpaqueToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

  await db.$transaction(async (tx) => {
    await tx.emailVerificationToken.updateMany({
      where: {
        userId: params.userId,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    });

    await tx.emailVerificationToken.create({
      data: {
        userId: params.userId,
        email: params.email,
        tokenHash,
        expiresAt,
      },
    });
  });

  const verifyUrl = `${getAppBaseUrl()}/verify-email?token=${encodeURIComponent(rawToken)}`;
  const greeting = params.name ? `Hi ${params.name},` : "Hello,";

  await sendTransactionalEmail({
    to: params.email,
    subject: "Verify your Stack Varsity email address",
    text: `${greeting}\n\nPlease verify your email address by visiting the link below:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    html: `<p>${greeting}</p><p>Please verify your Stack Varsity email address by clicking the link below:</p><p><a href="${verifyUrl}">Verify Email Address</a></p><p>This link expires in 24 hours.</p>`,
  });
}

export type VerifyEmailResult =
  { status: "VERIFIED" } | { status: "EXPIRED" } | { status: "INVALID" };

/**
 * Atomically consumes a single-use verification token and marks the user's email as verified.
 */
export async function verifyEmailWithToken(
  rawInput: unknown,
  context: VerificationContext = {}
): Promise<VerifyEmailResult> {
  const parsed = verifyTokenSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { status: "INVALID" };
  }

  const tokenHash = hashToken(parsed.data.token);
  const db = getDb();
  const now = new Date();

  const record = await db.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      consumedAt: true,
      user: {
        select: {
          id: true,
          status: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!record || record.consumedAt !== null) {
    return { status: "INVALID" };
  }

  if (record.expiresAt <= now) {
    return { status: "EXPIRED" };
  }

  if (record.user.deletedAt !== null || record.user.status !== "ACTIVE") {
    return { status: "INVALID" };
  }

  const consumed = await db.$transaction(async (tx) => {
    const updatedToken = await tx.emailVerificationToken.updateMany({
      where: {
        id: record.id,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        consumedAt: now,
      },
    });

    if (updatedToken.count !== 1) {
      return false;
    }

    await tx.user.update({
      where: { id: record.userId },
      data: { emailVerified: now },
    });

    return true;
  });

  if (!consumed) {
    return { status: "INVALID" };
  }

  await recordAuditEvent({
    actorId: record.userId,
    targetUserId: record.userId,
    eventType: "EMAIL_VERIFIED",
    outcome: "SUCCESS",
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
  });

  return { status: "VERIFIED" };
}

/**
 * Issues a fresh verification link for an unverified, active account without disclosing account existence.
 */
export async function resendVerificationEmail(
  rawInput: unknown,
  context: VerificationContext = {}
): Promise<void> {
  const parsed = resendSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Please enter a valid email");
  }

  const db = getDb();
  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      emailVerified: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt !== null || user.status !== "ACTIVE" || user.emailVerified !== null) {
    return;
  }

  await issueVerificationTokenAndSendEmail({
    userId: user.id,
    email: user.email,
    name: user.name,
  });

  await recordAuditEvent({
    actorId: user.id,
    targetUserId: user.id,
    eventType: "EMAIL_VERIFICATION_RESENT",
    outcome: "SUCCESS",
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
  });
}
