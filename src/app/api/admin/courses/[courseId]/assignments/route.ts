import { NextResponse } from "next/server";
import { requireRole } from "@/modules/auth/rbac";
import {
  assignInstructorToCourse,
  mapCourseRouteError,
} from "@/modules/courses/services/course-authoring-service";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

interface RouteContext {
  params: Promise<{ courseId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireRole(["ADMIN"], { requireAdminMfa: true });
    const { courseId } = await context.params;
    const body = await request.json().catch(() => null);
    const assignment = await assignInstructorToCourse(session, courseId, body);
    return NextResponse.json({ assignment }, { status: 201, headers: PRIVATE_HEADERS });
  } catch (error) {
    const mapped = mapCourseRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status, headers: PRIVATE_HEADERS });
  }
}
