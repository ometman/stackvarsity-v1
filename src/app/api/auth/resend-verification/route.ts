import { NextRequest, NextResponse } from "next/server";
import { AuthModuleError } from "@/modules/auth/errors";
import { resendVerificationEmail } from "@/modules/auth/verification-service";
import { logger } from "@/server/logger";
import { getClientIp, getRateLimiter } from "@/server/rate-limit";

const RESEND_RATE_LIMIT = 3;
const RESEND_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const ipAddress = getClientIp(request.headers);
  const userAgent = request.headers.get("user-agent");

  const rateLimit = await getRateLimiter().consume(
    `resend-verification:${ipAddress}`,
    RESEND_RATE_LIMIT,
    RESEND_WINDOW_MS
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before requesting another link." },
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
    await resendVerificationEmail(body, { ipAddress, userAgent });
    return NextResponse.json(
      {
        message:
          "If an unverified account exists for that email address, a new verification link has been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthModuleError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    logger.error("Unexpected error resending verification email", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Unable to process your request right now. Please try again later." },
      { status: 500 }
    );
  }
}
