import { NextRequest, NextResponse } from "next/server";
import { AuthModuleError } from "@/modules/auth/errors";
import { completePasswordReset } from "@/modules/auth/password-reset-service";
import { logger } from "@/server/logger";
import { getClientIp, getRateLimiter } from "@/server/rate-limit";

const RESET_PASSWORD_LIMIT = 5;
const RESET_PASSWORD_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const ipAddress = getClientIp(request.headers);
  const userAgent = request.headers.get("user-agent");

  const rateLimit = await getRateLimiter().consume(
    `reset-password:${ipAddress}`,
    RESET_PASSWORD_LIMIT,
    RESET_PASSWORD_WINDOW_MS
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many password reset attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  try {
    await completePasswordReset(body, { ipAddress, userAgent });
    return NextResponse.json(
      { message: "Your password has been reset. You can now sign in with your new password." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthModuleError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error("Unexpected error in reset-password", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Unable to reset password right now. Please try again later." },
      { status: 500 }
    );
  }
}
