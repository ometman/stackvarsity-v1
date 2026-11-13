import { NextRequest, NextResponse } from "next/server";
import { AuthModuleError } from "@/modules/auth/errors";
import { requestPasswordReset } from "@/modules/auth/password-reset-service";
import { logger } from "@/server/logger";
import { getClientIp, getRateLimiter } from "@/server/rate-limit";

const FORGOT_PASSWORD_LIMIT = 3;
const FORGOT_PASSWORD_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const ipAddress = getClientIp(request.headers);
  const userAgent = request.headers.get("user-agent");

  const rateLimit = await getRateLimiter().consume(
    `forgot-password:${ipAddress}`,
    FORGOT_PASSWORD_LIMIT,
    FORGOT_PASSWORD_WINDOW_MS
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many password reset requests. Please try again later." },
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
    await requestPasswordReset(body, { ipAddress, userAgent });
    return NextResponse.json(
      {
        message:
          "If an account exists for that email address, we have sent password reset instructions.",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthModuleError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error("Unexpected error in forgot-password", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Unable to process password reset request right now." },
      { status: 500 }
    );
  }
}
