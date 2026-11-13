import { NextResponse } from "next/server";
import { requireAuth } from "@/modules/auth/server-auth";
import {
  listUserEnrollments,
  mapEnrollmentRouteError,
} from "@/modules/enrollments/services/enrollment-service";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export async function GET() {
  try {
    const session = await requireAuth();
    const enrollments = await listUserEnrollments(session.user.id);
    return NextResponse.json({ enrollments }, { status: 200, headers: PRIVATE_HEADERS });
  } catch (error) {
    const mapped = mapEnrollmentRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status, headers: PRIVATE_HEADERS });
  }
}
