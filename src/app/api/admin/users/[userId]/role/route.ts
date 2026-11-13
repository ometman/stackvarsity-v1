import { NextRequest, NextResponse } from "next/server";
import { changeUserRole } from "@/modules/administration/role-management-service";
import { AuthModuleError } from "@/modules/auth/errors";
import { logger } from "@/server/logger";
import { getClientIp } from "@/server/rate-limit";

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { userId } = await context.params;
  const ipAddress = getClientIp(request.headers);
  const userAgent = request.headers.get("user-agent");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const payload =
    typeof body === "object" && body !== null
      ? { ...(body as Record<string, unknown>), targetUserId: userId }
      : { targetUserId: userId };

  try {
    const result = await changeUserRole(payload, { ipAddress, userAgent });
    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthModuleError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    logger.error("Unexpected error changing user role", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Unable to update user role" }, { status: 500 });
  }
}
