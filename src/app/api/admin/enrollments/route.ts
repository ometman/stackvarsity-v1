import { NextResponse } from "next/server";
import { requireRole } from "@/modules/auth/rbac";
import {
  adminManageEnrollment,
  mapEnrollmentRouteError,
} from "@/modules/enrollments/services/enrollment-service";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  try {
    const session = await requireRole(["ADMIN"], { requireAdminMfa: true });
    const body = await request.json().catch(() => null);
    const enrollment = await adminManageEnrollment(session, body);
    return NextResponse.json({ enrollment }, { status: 200, headers: PRIVATE_HEADERS });
  } catch (error) {
    const mapped = mapEnrollmentRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status, headers: PRIVATE_HEADERS });
  }
}
