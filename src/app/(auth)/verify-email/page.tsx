import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailView } from "@/components/auth/verify-email-view";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your Stack Varsity email address.",
};

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

async function VerifyEmailContent({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : undefined;
  return <VerifyEmailView token={token} />;
}

export default function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
        <VerifyEmailContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
