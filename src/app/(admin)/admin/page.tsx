import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageRole } from "@/modules/auth/route-guards";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Authenticated administrator workspace for Stack Varsity.",
};

async function AdminDashboardContent() {
  const session = await requirePageRole("ADMIN", "/admin");

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            <h1>Administrator Dashboard</h1>
          </CardTitle>
          <Badge>{session.user.role}</Badge>
        </div>
        <CardDescription>
          Signed in as {session.user.name ?? session.user.email} ({session.user.email})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          MFA Status:{" "}
          <span className="font-medium text-foreground">
            {session.user.mfaEnabled ? "Enabled" : "Not yet enrolled"}
          </span>
        </p>
        <p>
          <Link
            href="/admin/mfa"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Manage Administrator MFA &amp; Recovery Codes
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 justify-center px-4 py-10">
      <Suspense
        fallback={<div className="text-sm text-muted-foreground">Loading workspace...</div>}
      >
        <AdminDashboardContent />
      </Suspense>
    </main>
  );
}
