import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Stack Varsity account.",
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

async function ResetPasswordContent({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : undefined;
  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
        <ResetPasswordContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
