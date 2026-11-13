"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminMfaPanelProps {
  mfaEnabled: boolean;
  mfaVerified: boolean;
}

export function AdminMfaPanel({ mfaEnabled, mfaVerified }: AdminMfaPanelProps) {
  const router = useRouter();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleStartEnrollment() {
    setError(null);
    setStatus(null);
    setIsPending(true);
    try {
      const res = await fetch("/api/admin/mfa/enroll", { method: "POST" });
      const data = (await res.json()) as {
        qrCodeDataUrl?: string;
        manualSecret?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Unable to start MFA enrollment");
        return;
      }
      setQrCodeDataUrl(data.qrCodeDataUrl ?? null);
      setManualSecret(data.manualSecret ?? null);
    } finally {
      setIsPending(false);
    }
  }

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setIsPending(true);
    try {
      const res = await fetch("/api/admin/mfa/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { recoveryCodes?: string[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Invalid authenticator code");
        return;
      }
      setRecoveryCodes(data.recoveryCodes ?? null);
      setStatus("Administrator MFA is now active. Save your recovery codes in a safe place.");
      setCode("");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  async function handleVerifyChallenge(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setIsPending(true);
    try {
      const res = await fetch("/api/admin/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { redirectTo?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Invalid verification code");
        return;
      }
      router.push(data.redirectTo ?? "/admin");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  async function handleRotateRecoveryCodes(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    setIsPending(true);
    try {
      const res = await fetch("/api/admin/mfa/recovery-codes/rotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { recoveryCodes?: string[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Unable to rotate recovery codes");
        return;
      }
      setRecoveryCodes(data.recoveryCodes ?? null);
      setStatus("Recovery codes rotated. Previous recovery codes are no longer valid.");
      setCode("");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="w-full max-w-lg shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          <h1>Administrator Multi-Factor Authentication</h1>
        </CardTitle>
        <CardDescription>
          {!mfaEnabled && "Protect your administrator account with an authenticator app (TOTP)."}
          {mfaEnabled && !mfaVerified && "Enter a 6-digit TOTP code or a single-use recovery code."}
          {mfaEnabled && mfaVerified && "Your administrator session is MFA-verified."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        {status ? (
          <div
            role="status"
            className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
          >
            {status}
          </div>
        ) : null}

        {recoveryCodes ? (
          <div className="space-y-2 rounded-md border bg-muted/40 p-4">
            <p className="text-sm font-medium">One-time recovery codes (save now):</p>
            <ul className="grid grid-cols-2 gap-2 font-mono text-xs">
              {recoveryCodes.map((rc) => (
                <li key={rc}>{rc}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {!mfaEnabled && !qrCodeDataUrl ? (
          <Button type="button" onClick={handleStartEnrollment} disabled={isPending}>
            {isPending ? "Preparing QR code..." : "Begin MFA enrollment"}
          </Button>
        ) : null}

        {!mfaEnabled && qrCodeDataUrl ? (
          <form onSubmit={handleActivate} className="space-y-4">
            <div className="flex flex-col items-center gap-3 rounded-md border p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCodeDataUrl} alt="Authenticator QR code" className="h-44 w-44" />
              {manualSecret ? (
                <p className="text-xs text-muted-foreground">
                  Manual secret: <code className="font-mono text-foreground">{manualSecret}</code>
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mfa-activate-code">6-digit authenticator code</Label>
              <Input
                id="mfa-activate-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isPending}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Activating MFA..." : "Verify and activate MFA"}
            </Button>
          </form>
        ) : null}

        {mfaEnabled && !mfaVerified ? (
          <form onSubmit={handleVerifyChallenge} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mfa-challenge-code">Authenticator or recovery code</Label>
              <Input
                id="mfa-challenge-code"
                autoComplete="one-time-code"
                placeholder="123456 or A1B2-C3D4-E5F6"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isPending}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Verifying..." : "Verify MFA"}
            </Button>
          </form>
        ) : null}

        {mfaEnabled && mfaVerified ? (
          <form onSubmit={handleRotateRecoveryCodes} className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="mfa-rotate-code">
                Enter current 6-digit TOTP code to rotate recovery codes
              </Label>
              <Input
                id="mfa-rotate-code"
                inputMode="numeric"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isPending}
              />
            </div>
            <Button type="submit" variant="secondary" disabled={isPending}>
              {isPending ? "Rotating codes..." : "Rotate recovery codes"}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
