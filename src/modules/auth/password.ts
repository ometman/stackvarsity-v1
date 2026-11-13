import "server-only";
import { hash, verify } from "@node-rs/argon2";

/**
 * OWASP-recommended Argon2id parameters for interactive authentication.
 * `algorithm: 2` corresponds to Argon2id in `@node-rs/argon2` (avoids TS2748 const enum error under isolatedModules).
 */
const ARGON2_OPTIONS = {
  algorithm: 2,
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

/**
 * Dummy Argon2id hash used to perform constant-time verification when a user
 * record does not exist, mitigating timing-based account enumeration.
 */
const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$c3RhY2t2YXJzaXR5ZHVtbXk$1fL5J7w5k+vA2J9rY0xP6vN4Z3qR8tU2wX5yZ7aB9cE";

/**
 * Hashes a plaintext password using Argon2id.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error("Password must not be empty");
  }
  return hash(password, ARGON2_OPTIONS);
}

/**
 * Verifies a plaintext password against a stored Argon2id hash.
 */
export async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  if (!storedHash || !password) {
    return false;
  }
  try {
    return await verify(storedHash, password);
  } catch {
    return false;
  }
}

/**
 * Performs a dummy Argon2id verification to equalize response timing on unknown accounts.
 */
export async function verifyDummyPassword(password: string): Promise<void> {
  await verifyPassword(DUMMY_PASSWORD_HASH, password || "dummy-password");
}
