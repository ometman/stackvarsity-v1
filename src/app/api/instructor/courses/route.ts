import { NextResponse } from "next/server";
import { AuthModuleError } from "@/modules/auth/errors";
import { requireRole } from "@/modules/auth/rbac";

export async function GET() {
  try {
    const session = await requireRole(["INSTRUCTOR", "ADMIN"]);
    return NextResponse.json(
      {
        instructorId: session.user.id,
        assignedCourses: [],
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthModuleError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json({ error: "Unable to load instructor courses" }, { status: 500 });
  }
}
