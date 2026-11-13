import { NextResponse } from "next/server";
import { PERMISSIONS } from "@/modules/auth/permissions";
import { requirePermission } from "@/modules/auth/rbac";
import {
  createModuleLesson,
  mapCourseRouteError,
  updateModuleLesson,
} from "@/modules/courses/services/course-authoring-service";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

interface RouteContext {
  params: Promise<{ moduleId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requirePermission(PERMISSIONS.INSTRUCTOR_COURSES_MANAGE_ASSIGNED);
    const { moduleId } = await context.params;
    const body = await request.json().catch(() => null);
    const lesson = await createModuleLesson(session, moduleId, body);
    return NextResponse.json({ lesson }, { status: 201, headers: PRIVATE_HEADERS });
  } catch (error) {
    const mapped = mapCourseRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status, headers: PRIVATE_HEADERS });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requirePermission(PERMISSIONS.INSTRUCTOR_COURSES_MANAGE_ASSIGNED);
    const { moduleId } = await context.params;
    const body = await request.json().catch(() => null);
    const lesson = await updateModuleLesson(session, moduleId, body);
    return NextResponse.json({ lesson }, { status: 200, headers: PRIVATE_HEADERS });
  } catch (error) {
    const mapped = mapCourseRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status, headers: PRIVATE_HEADERS });
  }
}
