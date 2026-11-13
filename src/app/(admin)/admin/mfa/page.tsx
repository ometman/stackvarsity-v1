import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminMfaPanel } from "@/components/admin/admin-mfa-panel";
import { getDefaultDashboardPath } from "@/modules/auth/redirects";
import { getCurrentSession } from "@/modules/auth/server-auth";

export const metadata: Metadata = {
  title: "Administrator MFA",
  description: "Manage or verify Administrator Multi-Factor Authentication.",
};

async function AdminMfaContent() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login?next=%2Fadmin%2Fmfa");
  }

  if (session.user.role !== "ADMIN") {
    redirect(getDefaultDashboardPath(session.user.role));
  }

  return (
    <AdminMfaPanel
      mfaEnabled={session.user.mfaEnabled}
      mfaVerified={session.mfaVerifiedAt !== null}
    />
  );
}

export default function AdminMfaPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 justify-center px-4 py-10">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading MFA...</div>}>
        <AdminMfaContent />
      </Suspense>
    </main>
  );
}
