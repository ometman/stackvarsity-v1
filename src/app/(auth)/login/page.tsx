import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Stack Varsity account.",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

async function LoginContent({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = typeof params.next === "string" ? params.next : undefined;
  return <LoginForm nextPath={nextPath} />;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
