import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { requireServerEnv } from "@/config/server-env";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

function getMfaEncryptionKey(): Buffer {
  const authSecret = requireServerEnv("AUTH_SECRET");
  return createHash("sha256").update(`stackvarsity:mfa-key:${authSecret}`).digest();
}

/**
 * Encrypts a TOTP base32 secret with AES-256-GCM before database persistence.
 */
export function encryptMfaSecret(plaintextSecret: string): string {
  const key = getMfaEncryptionKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintextSecret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${authTag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

/**
 * Decrypts a stored AES-256-GCM encrypted TOTP secret.
 */
export function decryptMfaSecret(payload: string): string {
  const parts = payload.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted MFA secret format");
  }
  const [ivB64, tagB64, dataB64] = parts;
  const key = getMfaEncryptionKey();
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Generates single-use human-readable recovery codes (e.g., "A1B2-C3D4-E5F6").
 */
export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const raw = randomBytes(6).toString("hex").toUpperCase();
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`);
  }
  return codes;
}

/**
 * Normalizes a recovery code by removing hyphens/whitespace and uppercasing.
 */
export function normalizeRecoveryCode(code: string): string {
  return code
    .replace(/[\s-]+/g, "")
    .trim()
    .toUpperCase();
}

/**
 * Computes a SHA-256 hash of a normalized recovery code for database storage.
 */
export function hashRecoveryCode(code: string): string {
  return createHash("sha256").update(normalizeRecoveryCode(code)).digest("hex");
}
