import { NextResponse } from "next/server";
import { AuthModuleError } from "@/modules/auth/errors";
import { joinPreparationTrack } from "@/modules/certification/services/learner-track-service";
import { CertificationServiceError } from "@/modules/certification/services/track-errors";

const PRIVATE_NO_STORE = { "Cache-Control": "private, no-store" };

export async function POST(
  _request: Request,
  context: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await context.params;
    const enrollment = await joinPreparationTrack(trackId);
    return NextResponse.json({ enrollment }, { status: 200, headers: PRIVATE_NO_STORE });
  } catch (error) {
    if (error instanceof AuthModuleError || error instanceof CertificationServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode, headers: PRIVATE_NO_STORE }
      );
    }
    return NextResponse.json(
      { error: "Unable to join preparation track" },
      { status: 500, headers: PRIVATE_NO_STORE }
    );
  }
}
