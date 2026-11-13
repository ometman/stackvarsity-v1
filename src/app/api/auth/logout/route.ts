import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/modules/auth/audit";
import { signOut } from "@/modules/auth/auth";
import { getCurrentSession } from "@/modules/auth/server-auth";
import { revokeDatabaseSession } from "@/modules/auth/session-repository";

export async function POST() {
  const session = await getCurrentSession();

  if (session) {
    await revokeDatabaseSession(session.sessionToken);
    await recordAuditEvent({
      actorId: session.user.id,
      targetUserId: session.user.id,
      eventType: "LOGOUT",
      outcome: "SUCCESS",
    });
  }

  await signOut({ redirect: false });

  return NextResponse.json({ message: "Signed out successfully." }, { status: 200 });
}
