import { NextResponse } from "next/server";
import { AuthModuleError } from "@/modules/auth/errors";
import {
  createOrGetLearnerStudyPlan,
  getLearnerStudyPlan,
  rescheduleLearnerStudyPlan,
} from "@/modules/certification/services/study-plan-service";
import { CertificationServiceError } from "@/modules/certification/services/track-errors";

const PRIVATE_NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(
  _request: Request,
  context: { params: Promise<{ trackId: string }> }
) {
  try {
    const { trackId } = await context.params;
    const plan = await getLearnerStudyPlan(trackId);
    return NextResponse.json({ plan }, { status: 200, headers: PRIVATE_NO_STORE });
  } catch (error) {
    if (error instanceof AuthModuleError || error instanceof CertificationServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode, headers: PRIVATE_NO_STORE }
      );
    }
    return NextResponse.json(
      { error: "Unable to load study plan" },
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
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const plan =
      body.action === "reschedule"
        ? await rescheduleLearnerStudyPlan(trackId, body)
        : await createOrGetLearnerStudyPlan(trackId, body);
    return NextResponse.json({ plan }, { status: 200, headers: PRIVATE_NO_STORE });
  } catch (error) {
    if (error instanceof AuthModuleError || error instanceof CertificationServiceError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode, headers: PRIVATE_NO_STORE }
      );
    }
    return NextResponse.json(
      { error: "Unable to save study plan" },
      { status: 500, headers: PRIVATE_NO_STORE }
    );
  }
}
