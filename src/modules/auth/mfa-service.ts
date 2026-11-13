import "server-only";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { z } from "zod";
import { getDb } from "@/server/db";
import { recordAuditEvent } from "./audit";
import { ForbiddenError, ValidationError } from "./errors";
import {
  decryptMfaSecret,
  encryptMfaSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
} from "./mfa-crypto";
import { requireRole } from "./rbac";
import { requireAuth } from "./server-auth";
import { markSessionMfaVerified } from "./session-repository";

const TOTP_ISSUER = "Stack Varsity";
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;

const totpCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Please enter a valid 6-digit authenticator code"),
});

const mfaChallengeSchema = z.object({
  code: z.string().trim().min(6, "Verification code is required").max(32),
});

function buildTotpInstance(email: string, base32Secret: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: TOTP_ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD_SECONDS,
    secret: OTPAuth.Secret.fromBase32(base32Secret),
  });
}

function getCurrentTimeStep(timestampMs = Date.now()): number {
  return Math.floor(timestampMs / 1000 / TOTP_PERIOD_SECONDS);
}

/**
 * Begins TOTP enrollment for an authenticated ADMIN.
 */
export async function beginAdminMfaEnrollment(): Promise<{
  otpauthUri: string;
  qrCodeDataUrl: string;
  manualSecret: string;
}> {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    throw new ForbiddenError("Administrator privileges required for MFA enrollment");
  }
  if (session.user.mfaEnabled) {
    throw new ValidationError("Administrator MFA is already enabled");
  }

  const secret = new OTPAuth.Secret({ size: 20 });
  const base32Secret = secret.base32;
  const totp = buildTotpInstance(session.user.email, base32Secret);
  const otpauthUri = totp.toString();
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri);
  const encryptedSecret = encryptMfaSecret(base32Secret);

  const db = getDb();
  await db.adminMfaFactor.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      encryptedSecret,
      verifiedAt: null,
      lastUsedStep: null,
    },
    update: {
      encryptedSecret,
      verifiedAt: null,
      lastUsedStep: null,
    },
  });

  return {
    otpauthUri,
    qrCodeDataUrl,
    manualSecret: base32Secret,
  };
}

/**
 * Verifies the initial TOTP code, activates Admin MFA, and issues single-use recovery codes.
 */
export async function activateAdminMfa(rawInput: unknown): Promise<{ recoveryCodes: string[] }> {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    throw new ForbiddenError();
  }

  const parsed = totpCodeSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid authenticator code");
  }

  const db = getDb();
  const factor = await db.adminMfaFactor.findUnique({
    where: { userId: session.user.id },
  });

  if (!factor) {
    throw new ValidationError("Please start MFA enrollment before activating");
  }

  const secretBase32 = decryptMfaSecret(factor.encryptedSecret);
  const totp = buildTotpInstance(session.user.email, secretBase32);
  const delta = totp.validate({ token: parsed.data.code, window: 1 });

  if (delta === null) {
    await recordAuditEvent({
      actorId: session.user.id,
      targetUserId: session.user.id,
      eventType: "MFA_ENROLLMENT_FAILED",
      outcome: "FAILURE",
    });
    throw new ValidationError("Invalid or expired authenticator code");
  }

  const matchedStep = BigInt(getCurrentTimeStep() + delta);
  const recoveryCodes = generateRecoveryCodes(10);
  const now = new Date();

  await db.$transaction(async (tx) => {
    await tx.adminMfaFactor.update({
      where: { id: factor.id },
      data: {
        verifiedAt: now,
        lastUsedStep: matchedStep,
      },
    });

    await tx.user.update({
      where: { id: session.user.id },
      data: { mfaEnabled: true },
    });

    await tx.mfaRecoveryCode.deleteMany({
      where: { userId: session.user.id },
    });

    await tx.mfaRecoveryCode.createMany({
      data: recoveryCodes.map((code) => ({
        userId: session.user.id,
        codeHash: hashRecoveryCode(code),
      })),
    });
  });

  await markSessionMfaVerified(session.sessionToken);

  await recordAuditEvent({
    actorId: session.user.id,
    targetUserId: session.user.id,
    eventType: "MFA_ENROLLED",
    outcome: "SUCCESS",
  });

  return { recoveryCodes };
}

/**
 * Verifies an Admin MFA challenge using either a TOTP code (with replay protection)
 * or a single-use recovery code.
 */
export async function verifyAdminMfaChallenge(
  rawInput: unknown
): Promise<{ method: "TOTP" | "RECOVERY_CODE" }> {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") {
    throw new ForbiddenError();
  }

  const parsed = mfaChallengeSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid verification code");
  }

  const db = getDb();
  const code = parsed.data.code;
  const isSixDigitTotp = /^\d{6}$/.test(code);

  if (isSixDigitTotp) {
    const factor = await db.adminMfaFactor.findUnique({
      where: { userId: session.user.id },
    });

    if (!factor || !factor.verifiedAt) {
      throw new ValidationError("Administrator MFA is not enrolled");
    }

    const secretBase32 = decryptMfaSecret(factor.encryptedSecret);
    const totp = buildTotpInstance(session.user.email, secretBase32);
    const delta = totp.validate({ token: code, window: 1 });

    if (delta === null) {
      await recordAuditEvent({
        actorId: session.user.id,
        targetUserId: session.user.id,
        eventType: "MFA_FAILED",
        outcome: "FAILURE",
        metadata: { method: "TOTP" },
      });
      throw new ValidationError("Invalid or expired authenticator code");
    }

    const matchedStep = BigInt(getCurrentTimeStep() + delta);
    if (factor.lastUsedStep !== null && matchedStep <= factor.lastUsedStep) {
      await recordAuditEvent({
        actorId: session.user.id,
        targetUserId: session.user.id,
        eventType: "MFA_REPLAY_BLOCKED",
        outcome: "DENIED",
      });
      throw new ValidationError(
        "This authenticator code has already been used. Wait for the next code."
      );
    }

    const updated = await db.adminMfaFactor.updateMany({
      where: {
        id: factor.id,
        OR: [{ lastUsedStep: null }, { lastUsedStep: { lt: matchedStep } }],
      },
      data: { lastUsedStep: matchedStep },
    });

    if (updated.count !== 1) {
      throw new ValidationError("This authenticator code has already been used.");
    }

    await markSessionMfaVerified(session.sessionToken);

    await recordAuditEvent({
      actorId: session.user.id,
      targetUserId: session.user.id,
      eventType: "MFA_VERIFIED",
      outcome: "SUCCESS",
      metadata: { method: "TOTP" },
    });

    return { method: "TOTP" };
  }

  // Single-use recovery code fallback
  const codeHash = hashRecoveryCode(code);
  const recoveryRecord = await db.mfaRecoveryCode.findFirst({
    where: {
      userId: session.user.id,
      codeHash,
      usedAt: null,
    },
    select: { id: true },
  });

  if (!recoveryRecord) {
    await recordAuditEvent({
      actorId: session.user.id,
      targetUserId: session.user.id,
      eventType: "MFA_FAILED",
      outcome: "FAILURE",
      metadata: { method: "RECOVERY_CODE" },
    });
    throw new ValidationError("Invalid or already used recovery code");
  }

  const consumed = await db.mfaRecoveryCode.updateMany({
    where: {
      id: recoveryRecord.id,
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });

  if (consumed.count !== 1) {
    throw new ValidationError("Invalid or already used recovery code");
  }

  await markSessionMfaVerified(session.sessionToken);

  await recordAuditEvent({
    actorId: session.user.id,
    targetUserId: session.user.id,
    eventType: "RECOVERY_CODE_USED",
    outcome: "SUCCESS",
  });

  return { method: "RECOVERY_CODE" };
}

/**
 * Rotates all recovery codes for an MFA-verified administrator after TOTP confirmation.
 */
export async function rotateAdminRecoveryCodes(
  rawInput: unknown
): Promise<{ recoveryCodes: string[] }> {
  const session = await requireRole("ADMIN", { requireAdminMfa: true });

  const parsed = totpCodeSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid authenticator code");
  }

  const db = getDb();
  const factor = await db.adminMfaFactor.findUnique({
    where: { userId: session.user.id },
  });

  if (!factor || !factor.verifiedAt) {
    throw new ValidationError("Administrator MFA is not enrolled");
  }

  const secretBase32 = decryptMfaSecret(factor.encryptedSecret);
  const totp = buildTotpInstance(session.user.email, secretBase32);
  const delta = totp.validate({ token: parsed.data.code, window: 1 });

  if (delta === null) {
    throw new ValidationError("Invalid or expired authenticator code");
  }

  const matchedStep = BigInt(getCurrentTimeStep() + delta);
  if (factor.lastUsedStep !== null && matchedStep <= factor.lastUsedStep) {
    throw new ValidationError("This authenticator code has already been used.");
  }

  const recoveryCodes = generateRecoveryCodes(10);

  await db.$transaction(async (tx) => {
    await tx.adminMfaFactor.update({
      where: { id: factor.id },
      data: { lastUsedStep: matchedStep },
    });

    await tx.mfaRecoveryCode.deleteMany({
      where: { userId: session.user.id },
    });

    await tx.mfaRecoveryCode.createMany({
      data: recoveryCodes.map((code) => ({
        userId: session.user.id,
        codeHash: hashRecoveryCode(code),
      })),
    });
  });

  await recordAuditEvent({
    actorId: session.user.id,
    targetUserId: session.user.id,
    eventType: "MFA_RECOVERY_CODES_ROTATED",
    outcome: "SUCCESS",
  });

  return { recoveryCodes };
}
