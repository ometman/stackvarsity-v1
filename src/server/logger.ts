import "server-only";

export type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  event: string;
  timestamp: string;
  [key: string]: unknown;
}

function writeLog(level: LogLevel, event: string, meta?: Record<string, unknown>): void {
  const payload: LogPayload = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  const serialized = JSON.stringify(payload);
  if (level === "error") {
    console.error(serialized);
  } else if (level === "warn") {
    console.warn(serialized);
  } else {
    console.info(serialized);
  }
}

/**
 * Minimal structured server logger.
 * Never pass secrets, credentials, tokens, or personal information in `meta`.
 */
export const logger = {
  info: (event: string, meta?: Record<string, unknown>) => writeLog("info", event, meta),
  warn: (event: string, meta?: Record<string, unknown>) => writeLog("warn", event, meta),
  error: (event: string, meta?: Record<string, unknown>) => writeLog("error", event, meta),
};
