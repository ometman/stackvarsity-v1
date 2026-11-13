import "server-only";
import { createHash, randomBytes } from "node:crypto";

/**
 * Generates a cryptographically secure, URL-safe opaque token.
 */
export function generateOpaqueToken(byteLength = 32): string {
  return randomBytes(byteLength).toString("base64url");
}

/**
 * Computes a deterministic SHA-256 hex digest of an opaque token for database storage.
 * Raw tokens must never be persisted in the database.
 */
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
