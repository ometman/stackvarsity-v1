import { NextRequest, NextResponse } from "next/server";
import { AuthModuleError } from "@/modules/auth/errors";
import { activateAdminMfa } from "@/modules/auth/mfa-service";
import { logger } from "@/server/logger";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  try {
    const result = await activateAdminMfa(body);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AuthModuleError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    logger.error("Unexpected error activating admin MFA", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Unable to activate MFA" }, { status: 500 });
  }
}
