import { NextRequest, NextResponse } from "next/server";
import { AuthError } from "next-auth";
import { signIn } from "@/modules/auth/auth";
import { getDefaultDashboardPath, sanitizeRedirectPath } from "@/modules/auth/redirects";
import { credentialsLoginSchema } from "@/modules/auth/schemas";
import { getDb } from "@/server/db";
import { logger } from "@/server/logger";
import { getClientIp, getRateLimiter } from "@/server/rate-limit";

const LOGIN_RATE_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  const ipAddress = getClientIp(request.headers);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const parsed = credentialsLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid email address and password." },
      { status: 400 }
    );
  }

  const rateLimitKey = `login:${ipAddress}:${parsed.data.email}`;
  const rateLimit = await getRateLimiter().consume(rateLimitKey, LOGIN_RATE_LIMIT, LOGIN_WINDOW_MS);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  const requestedNext =
    typeof (body as Record<string, unknown>)?.next === "string"
      ? ((body as Record<string, unknown>).next as string)
      : undefined;

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      rememberMe: String(parsed.data.rememberMe),
      redirect: false,
    });

    const user = await getDb().user.findUnique({
      where: { email: parsed.data.email },
      select: { role: true, mfaEnabled: true },
    });

    const defaultPath = user ? getDefaultDashboardPath(user.role) : "/student";
    const redirectTo =
      user?.role === "ADMIN" && user.mfaEnabled
        ? "/admin/mfa"
        : sanitizeRedirectPath(requestedNext, defaultPath);

    return NextResponse.json({ message: "Signed in successfully.", redirectTo }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    logger.error("Unexpected error during login", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      { error: "Unable to sign in right now. Please try again later." },
      { status: 500 }
    );
  }
}
