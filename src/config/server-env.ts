import "server-only";
import { z } from "zod";

const optionalNonEmptyString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(1).optional()
);

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().url().optional()
);

const optionalPostgresUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z
    .string()
    .refine(
      (val) => val.startsWith("postgresql://") || val.startsWith("postgres://"),
      "DATABASE_URL must start with postgresql:// or postgres://"
    )
    .optional()
);

const optionalAuthSecret = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(32, "AUTH_SECRET must be at least 32 characters when set").optional()
);

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: optionalPostgresUrl,
  AUTH_SECRET: optionalAuthSecret,
  AUTH_URL: optionalUrl,
  PAYSTACK_SECRET_KEY: optionalNonEmptyString,
  PAYSTACK_WEBHOOK_SECRET: optionalNonEmptyString,
  EMAIL_PROVIDER_API_KEY: optionalNonEmptyString,
  EMAIL_FROM: optionalNonEmptyString,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates server-only environment variables without leaking secret values in errors.
 */
export function parseServerEnv(input: Record<string, string | undefined>): ServerEnv {
  const result = serverEnvSchema.safeParse(input);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server environment configuration: ${details}`);
  }
  return result.data;
}

let cachedServerEnv: ServerEnv | null = null;

/**
 * Returns validated server-only environment configuration.
 * Cached per server process.
 */
export function getServerEnv(): ServerEnv {
  if (!cachedServerEnv) {
    cachedServerEnv = parseServerEnv(process.env);
  }
  return cachedServerEnv;
}

/**
 * Retrieves a required server environment variable or throws a clear configuration error.
 */
export function requireServerEnv<K extends keyof ServerEnv>(key: K): NonNullable<ServerEnv[K]> {
  const env = getServerEnv();
  const value = env[key];
  if (value === undefined || value === null || value === "") {
    throw new Error(
      `Missing required server environment variable "${String(key)}". Check .env.local against .env.example.`
    );
  }
  return value as NonNullable<ServerEnv[K]>;
}
