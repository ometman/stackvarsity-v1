"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VerifyEmailViewProps {
  token?: string;
}

type VerificationState = "idle" | "verifying" | "verified" | "expired" | "invalid";

export function VerifyEmailView({ token }: VerifyEmailViewProps) {
  const [state, setState] = useState<VerificationState>(token ? "verifying" : "idle");
  const [message, setMessage] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;
    async function verify() {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = (await res.json()) as {
          status?: string;
          message?: string;
          error?: string;
        };

        if (!active) return;

        if (res.ok && data.status === "VERIFIED") {
          setState("verified");
          setMessage(data.message ?? "Your email address has been verified.");
        } else if (data.status === "EXPIRED") {
          setState("expired");
          setMessage(data.error ?? "This verification link has expired.");
        } else {
          setState("invalid");
          setMessage(data.error ?? "This verification link is invalid or has already been used.");
        }
      } catch {
        if (!active) return;
        setState("invalid");
        setMessage("Unable to verify your email right now. Please try again.");
      }
    }

    void verify();
    return () => {
      active = false;
    };
  }, [token]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setResendStatus(null);
    setResendError(null);
    setIsResending(true);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        setResendError(data.error ?? "Unable to resend verification email.");
      } else {
        setResendStatus(
          data.message ??
            "If an unverified account exists for that email address, a new verification link has been sent."
        );
        setResendEmail("");
      }
    } catch {
      setResendError("Network error while requesting a new verification link.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          <h1>Email verification</h1>
        </CardTitle>
        <CardDescription>
          {state === "idle" && "Check your email inbox for a verification link."}
          {state === "verifying" && "Verifying your email address..."}
          {state === "verified" && "Your account email is confirmed."}
          {state === "expired" && "Your verification link has expired."}
          {state === "invalid" && "We could not verify this link."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {state === "verified" ? (
          <div
            role="status"
            className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
          >
            {message}
          </div>
        ) : null}

        {state === "expired" || state === "invalid" ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {message}
          </div>
        ) : null}

        {state !== "verified" ? (
          <form onSubmit={handleResend} className="space-y-3 border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Need a new link? Enter your registered email address below.
            </p>
            <div className="space-y-2">
              <Label htmlFor="resend-email">Email address</Label>
              <Input
                id="resend-email"
                type="email"
                required
                placeholder="ada@example.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                disabled={isResending}
              />
            </div>
            {resendError ? (
              <p role="alert" className="text-xs text-destructive">
                {resendError}
              </p>
            ) : null}
            {resendStatus ? (
              <p role="status" className="text-xs text-emerald-700 dark:text-emerald-300">
                {resendStatus}
              </p>
            ) : null}
            <Button type="submit" variant="secondary" className="w-full" disabled={isResending}>
              {isResending ? "Sending link..." : "Request a new verification link"}
            </Button>
          </form>
        ) : null}
      </CardContent>

      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Proceed to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
