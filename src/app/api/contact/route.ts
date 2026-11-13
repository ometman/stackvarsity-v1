import { NextResponse } from "next/server";
import { submitContactInquiry } from "@/modules/contact/services/contact-service";
import { getClientIp } from "@/server/rate-limit";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON request body." }, { status: 400 });
  }

  const clientIp = getClientIp(request.headers);
  const result = await submitContactInquiry(body, clientIp);

  return NextResponse.json(
    {
      ok: result.ok,
      deliveryMode: result.deliveryMode,
      message: result.message,
      fieldErrors: result.fieldErrors,
    },
    { status: result.statusCode }
  );
}
