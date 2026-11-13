import { NextResponse } from "next/server";
import { AuthModuleError } from "@/modules/auth/errors";
import { PERMISSIONS } from "@/modules/auth/permissions";
import { requirePermission } from "@/modules/auth/rbac";
import { getDb } from "@/server/db";

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.ADMIN_AUDIT_READ);

    const events = await getDb().securityAuditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        actorId: true,
        targetUserId: true,
        eventType: true,
        outcome: true,
        ipAddress: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthModuleError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json({ error: "Unable to load audit events" }, { status: 500 });
  }
}
