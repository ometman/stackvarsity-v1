import { NextResponse } from "next/server";
import { AuthModuleError } from "@/modules/auth/errors";
import { beginAdminMfaEnrollment } from "@/modules/auth/mfa-service";
import { logger } from "@/server/logger";

export async function POST() {
  try {
    const result = await beginAdminMfaEnrollment();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof AuthModuleError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    logger.error("Unexpected error starting admin MFA enrollment", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Unable to begin MFA enrollment" }, { status: 500 });
  }
}
