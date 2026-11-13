import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/server/db";
import { logger } from "@/server/logger";

const READINESS_TIMEOUT_MS = 3000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Readiness check timed out")), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await withTimeout(checkDatabaseConnection(), READINESS_TIMEOUT_MS);
    return NextResponse.json(
      {
        status: "ok",
        service: "stackvarsity",
        timestamp,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    logger.error("readiness.check_failed", {
      reason: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      {
        status: "unavailable",
        service: "stackvarsity",
        timestamp,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
