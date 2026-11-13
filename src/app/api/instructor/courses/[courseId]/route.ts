import { NextResponse } from "next/server";
import { PERMISSIONS } from "@/modules/auth/permissions";
import { requirePermission } from "@/modules/auth/rbac";
import {
  getCourseForEditor,
  mapCourseRouteError,
  updateCourseMetadata,
} from "@/modules/courses/services/course-authoring-service";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

interface RouteContext {
  params: Promise<{ courseId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await requirePermission(PERMISSIONS.INSTRUCTOR_COURSES_MANAGE_ASSIGNED);
    const { courseId } = await context.params;
    const course = await getCourseForEditor(session, courseId);
    return NextResponse.json({ course }, { status: 200, headers: PRIVATE_HEADERS });
  } catch (error) {
    const mapped = mapCourseRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status, headers: PRIVATE_HEADERS });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requirePermission(PERMISSIONS.INSTRUCTOR_COURSES_MANAGE_ASSIGNED);
    const { courseId } = await context.params;
    const body = await request.json().catch(() => null);
    const course = await updateCourseMetadata(session, courseId, body);
    return NextResponse.json({ course }, { status: 200, headers: PRIVATE_HEADERS });
  } catch (error) {
    const mapped = mapCourseRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status, headers: PRIVATE_HEADERS });
  }
}
