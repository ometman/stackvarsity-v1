import { NextResponse } from "next/server";
import { AuthModuleError } from "@/modules/auth/errors";
import { toggleStudyTaskCompletion } from "@/modules/certification/services/study-plan-service";
import { CertificationServiceError } from "@/modules/certification/services/track-errors";

const PRIVATE_NO_STORE = { "Cache-Control": "private, no-store" };

export async function PATCH(
  request: Request,
  context: { params: Promise<{ trackId: string; taskId: string }> }
) {
  try {
    const { trackId, taskId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const task = await toggleStudyTaskCompletion(trackId, taskId, body);
    return NextResponse.json({ task }, { status: 200, headers: PRIVATE_NO_STORE });
  } catch (error) {
    if (error instanceof AuthModuleError || error instanceof CertificationServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode, headers: PRIVATE_NO_STORE }
      );
    }
    return NextResponse.json(
      { error: "Unable to update study task" },
      { status: 500, headers: PRIVATE_NO_STORE }
    );
  }
}
