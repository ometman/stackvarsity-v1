import { NextResponse } from "next/server";
import { requireAuth } from "@/modules/auth/server-auth";
import {
  enrollInFreeCourse,
  mapEnrollmentRouteError,
} from "@/modules/enrollments/services/enrollment-service";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json().catch(() => null);
    const result = await enrollInFreeCourse(session.user.id, body);
    return NextResponse.json(result, {
      status: result.created ? 201 : 200,
      headers: PRIVATE_HEADERS,
    });
  } catch (error) {
    const mapped = mapEnrollmentRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status, headers: PRIVATE_HEADERS });
  }
}
