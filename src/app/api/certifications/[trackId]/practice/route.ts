import { NextResponse } from "next/server";
import { AuthModuleError } from "@/modules/auth/errors";
import {
  startOrResumePracticeSession,
  submitPracticeResponse,
} from "@/modules/certification/services/practice-session-service";
import { CertificationServiceError } from "@/modules/certification/services/track-errors";

const PRIVATE_NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(
  _request: Request,
  context: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await context.params;
    const sessionData = await startOrResumePracticeSession(trackId);
    return NextResponse.json(sessionData, { status: 200, headers: PRIVATE_NO_STORE });
  } catch (error) {
    if (error instanceof AuthModuleError || error instanceof CertificationServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode, headers: PRIVATE_NO_STORE }
      );
    }
    return NextResponse.json(
      { error: "Unable to load formative practice" },
      { status: 500, headers: PRIVATE_NO_STORE }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const result = await submitPracticeResponse(trackId, body);
    return NextResponse.json(result, { status: 200, headers: PRIVATE_NO_STORE });
  } catch (error) {
    if (error instanceof AuthModuleError || error instanceof CertificationServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode, headers: PRIVATE_NO_STORE }
      );
    }
    return NextResponse.json(
      { error: "Unable to submit practice response" },
      { status: 500, headers: PRIVATE_NO_STORE }
    );
  }
}
