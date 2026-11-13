import { NextRequest, NextResponse } from "next/server";
import { AuthModuleError } from "@/modules/auth/errors";
import { verifyAdminMfaChallenge } from "@/modules/auth/mfa-service";
import { logger } from "@/server/logger";
import { getClientIp, getRateLimiter } from "@/server/rate-limit";

const MFA_VERIFY_LIMIT = 5;
const MFA_VERIFY_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  const ipAddress = getClientIp(request.headers);
  const rateLimit = await getRateLimiter().consume(
    `admin-mfa-verify:${ipAddress}`,
    MFA_VERIFY_LIMIT,
    MFA_VERIFY_WINDOW_MS
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many MFA attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  try {
    const result = await verifyAdminMfaChallenge(body);
    return NextResponse.json({ ...result, redirectTo: "/admin" }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthModuleError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    logger.error("Unexpected error verifying admin MFA", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Unable to verify MFA" }, { status: 500 });
  }
}
