import { NextRequest, NextResponse } from "next/server";
import { AuthModuleError } from "@/modules/auth/errors";
import { registerStudent } from "@/modules/auth/registration-service";
import { logger } from "@/server/logger";
import { getClientIp, getRateLimiter } from "@/server/rate-limit";

const REGISTER_RATE_LIMIT = 5;
const REGISTER_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  const ipAddress = getClientIp(request.headers);
  const userAgent = request.headers.get("user-agent");

  const rateLimit = await getRateLimiter().consume(
    `register:${ipAddress}`,
    REGISTER_RATE_LIMIT,
    REGISTER_WINDOW_MS
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many registration attempts. Please try again later.",
        code: "RATE_LIMITED",
      },
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
    return NextResponse.json(
      { error: "Invalid JSON request body", code: "INVALID_JSON" },
      { status: 400 }
    );
  }

  try {
    const user = await registerStudent(body, { ipAddress, userAgent });
    return NextResponse.json(
      {
        message: "Account created successfully. Please check your email to verify your account.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthModuleError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    logger.error("Unexpected error during student registration", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Unable to complete registration right now. Please try again later." },
      { status: 500 }
    );
  }
}
