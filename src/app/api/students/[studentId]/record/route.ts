import { NextResponse } from "next/server";
import { AuthModuleError } from "@/modules/auth/errors";
import { getStudentPrivateRecord } from "@/modules/users/student-record-service";
import { logger } from "@/server/logger";

interface RouteContext {
  params: Promise<{ studentId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { studentId } = await context.params;

  try {
    const record = await getStudentPrivateRecord(studentId);
    if (!record) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 });
    }
    return NextResponse.json({ record }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthModuleError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    logger.error("Unexpected error reading student record", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Unable to load student record" }, { status: 500 });
  }
}
