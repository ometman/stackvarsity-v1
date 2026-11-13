import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageRole } from "@/modules/auth/route-guards";

export const metadata: Metadata = {
  title: "Student Dashboard",
  description: "Authenticated student workspace for Stack Varsity.",
};

async function StudentDashboardContent() {
  const session = await requirePageRole(["STUDENT", "ADMIN"], "/student");

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            <h1>Student Dashboard</h1>
          </CardTitle>
          <Badge>{session.user.role}</Badge>
        </div>
        <CardDescription>
          Signed in as {session.user.name ?? session.user.email} ({session.user.email})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>Your student account is active and verified.</p>
        <p>Course enrollments and exam preparation modules will appear here in Phase 3+.</p>
      </CardContent>
    </Card>
  );
}

export default function StudentDashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 justify-center px-4 py-10">
      <Suspense
        fallback={<div className="text-sm text-muted-foreground">Loading workspace...</div>}
      >
        <StudentDashboardContent />
      </Suspense>
    </main>
  );
}
