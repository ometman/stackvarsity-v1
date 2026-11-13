import { NextResponse } from "next/server";
import { requirePermission } from "@/modules/auth/rbac";
import { PERMISSIONS } from "@/modules/auth/permissions";
import {
  createDraftCourse,
  listAssignedCourses,
  mapCourseRouteError,
} from "@/modules/courses/services/course-authoring-service";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export async function GET() {
  try {
    const session = await requirePermission(PERMISSIONS.INSTRUCTOR_COURSES_MANAGE_ASSIGNED);
    const courses = await listAssignedCourses(session);
    return NextResponse.json(
      {
        instructorId: session.user.id,
        assignedCourses: courses,
      },
      { status: 200, headers: PRIVATE_HEADERS }
    );
  } catch (error) {
    const mapped = mapCourseRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status, headers: PRIVATE_HEADERS });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission(PERMISSIONS.INSTRUCTOR_COURSES_MANAGE_ASSIGNED);
    const body = await request.json().catch(() => null);
    const course = await createDraftCourse(session, body);
    return NextResponse.json({ course }, { status: 201, headers: PRIVATE_HEADERS });
  } catch (error) {
    const mapped = mapCourseRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status, headers: PRIVATE_HEADERS });
  }
}
