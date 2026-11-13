import { NextResponse } from "next/server";
import { requireAuth } from "@/modules/auth/server-auth";
import {
  mapLearningRouteError,
  setLessonCompletion,
} from "@/modules/learning/services/progress-service";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json().catch(() => null);
    const result = await setLessonCompletion(session.user.id, body);
    return NextResponse.json(result, { status: 200, headers: PRIVATE_HEADERS });
  } catch (error) {
    const mapped = mapLearningRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status, headers: PRIVATE_HEADERS });
  }
}
