import "server-only";
import { getDb } from "@/server/db";
import { getAppBaseUrl, sendTransactionalEmail } from "@/server/mail";
import { recordAuditEvent } from "./audit";
import { ValidationError } from "./errors";
import { hashPassword } from "./password";
import { forgotPasswordSchema, resetPasswordSchema } from "./password-reset-schema";
import { generateOpaqueToken, hashToken } from "./tokens";

export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface PasswordResetContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Initiates password recovery without disclosing whether the email exists.
 */
export async function requestPasswordReset(
  rawInput: unknown,
  context: PasswordResetContext = {}
): Promise<void> {
  const parsed = forgotPasswordSchema.safeParse(rawInput);
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
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt !== null || user.status !== "ACTIVE") {
    return;
  }

  const rawToken = generateOpaqueToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  const now = new Date();

  await db.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        consumedAt: null,
      },
      data: {
        consumedAt: now,
      },
    });

    await tx.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        requestedIp: context.ipAddress ?? null,
      },
    });
  });

  const resetUrl = `${getAppBaseUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const greeting = user.name ? `Hi ${user.name},` : "Hello,";

  await sendTransactionalEmail({
    to: user.email,
    subject: "Reset your Stack Varsity password",
    text: `${greeting}\n\nWe received a request to reset your Stack Varsity password. Use the link below to set a new password:\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, you can safely ignore this email.`,
    html: `<p>${greeting}</p><p>We received a request to reset your Stack Varsity password. Click the link below to choose a new password:</p><p><a href="${resetUrl}">Reset Password</a></p><p>This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>`,
  });

  await recordAuditEvent({
    actorId: user.id,
    targetUserId: user.id,
    eventType: "PASSWORD_RESET_REQUESTED",
    outcome: "SUCCESS",
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
  });
}

/**
 * Atomically consumes a password reset token, updates the password hash,
 * and revokes all active sessions for the user.
 */
export async function completePasswordReset(
  rawInput: unknown,
  context: PasswordResetContext = {}
): Promise<void> {
  const parsed = resetPasswordSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid password reset input");
  }

  const { token, password } = parsed.data;
  const tokenHash = hashToken(token);
  const db = getDb();
  const now = new Date();

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      consumedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!record || record.consumedAt !== null || record.expiresAt <= now) {
    throw new ValidationError("This password reset link is invalid or has expired.");
  }

  if (record.user.deletedAt !== null || record.user.status !== "ACTIVE") {
    throw new ValidationError("This password reset link is invalid or has expired.");
  }

  const newPasswordHash = await hashPassword(password);

  const updated = await db.$transaction(async (tx) => {
    const consumed = await tx.passwordResetToken.updateMany({
      where: {
        id: record.id,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        consumedAt: now,
      },
    });

    if (consumed.count !== 1) {
      return false;
    }

    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash: newPasswordHash },
    });

    await tx.session.deleteMany({
      where: { userId: record.userId },
    });

    return true;
  });

  if (!updated) {
    throw new ValidationError("This password reset link is invalid or has expired.");
  }

  await recordAuditEvent({
    actorId: record.userId,
    targetUserId: record.userId,
    eventType: "PASSWORD_RESET_COMPLETED",
    outcome: "SUCCESS",
    ipAddress: context.ipAddress ?? null,
    userAgent: context.userAgent ?? null,
  });

  const greeting = record.user.name ? `Hi ${record.user.name},` : "Hello,";
  await sendTransactionalEmail({
    to: record.user.email,
    subject: "Your Stack Varsity password was changed",
    text: `${greeting}\n\nYour Stack Varsity password was recently changed. All active sessions have been signed out. If you did not make this change, please contact support immediately.`,
    html: `<p>${greeting}</p><p>Your Stack Varsity password was recently changed and all active sessions have been signed out.</p><p>If you did not make this change, please contact support immediately.</p>`,
  });
}
