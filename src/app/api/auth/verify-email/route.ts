import { NextRequest, NextResponse } from "next/server";
import { verifyEmailWithToken } from "@/modules/auth/verification-service";
import { logger } from "@/server/logger";
import { getClientIp, getRateLimiter } from "@/server/rate-limit";

const VERIFY_RATE_LIMIT = 15;
const VERIFY_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const ipAddress = getClientIp(request.headers);
  const userAgent = request.headers.get("user-agent");

  const rateLimit = await getRateLimiter().consume(
    `verify-email:${ipAddress}`,
    VERIFY_RATE_LIMIT,
    VERIFY_WINDOW_MS
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many verification attempts. Please try again later." },
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
    const result = await verifyEmailWithToken(body, { ipAddress, userAgent });
    if (result.status === "VERIFIED") {
      return NextResponse.json(
        { status: "VERIFIED", message: "Your email address has been verified." },
        { status: 200 }
      );
    }
    if (result.status === "EXPIRED") {
      return NextResponse.json(
        {
          status: "EXPIRED",
          error: "This verification link has expired. Please request a new verification link.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        status: "INVALID",
        error: "This verification link is invalid or has already been used.",
      },
      { status: 400 }
    );
  } catch (error) {
    logger.error("Unexpected error verifying email", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Unable to verify email right now. Please try again later." },
      { status: 500 }
    );
  }
}
