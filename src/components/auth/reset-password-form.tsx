"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { resetPasswordSchema, type ResetPasswordInput } from "@/modules/auth/password-reset-schema";

interface ResetPasswordFormProps {
  token?: string;
}

export function ResetPasswordForm({ token = "" }: ResetPasswordFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setServerError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setServerError(data.error ?? "Unable to reset password.");
        return;
      }

      setSuccessMessage(
        data.message ?? "Your password has been reset. You can now sign in with your new password."
      );
      reset({ token: "", password: "", confirmPassword: "" });
    } catch {
      setServerError("Network error while resetting your password. Please try again.");
    }
  }

  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          <h1>Reset password</h1>
        </CardTitle>
        <CardDescription>
          Choose a strong new password for your Stack Varsity account.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!token ? (
          <div
            role="alert"
            className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            This password reset link is missing a valid token. Please request a new reset link.
          </div>
        ) : null}

        {serverError ? (
          <div
            role="alert"
            className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {serverError}
          </div>
        ) : null}

        {successMessage ? (
          <div
            role="status"
            className="mb-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
          >
            {successMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <input type="hidden" {...register("token")} />

          <div className="space-y-2">
            <Label htmlFor="reset-password">New password</Label>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimum 10 characters"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "reset-password-error" : "reset-password-help"}
              disabled={isSubmitting || !token}
              {...register("password")}
            />
            <p id="reset-password-help" className="text-xs text-muted-foreground">
              Use 10+ characters with uppercase, lowercase, number, and symbol.
            </p>
            {errors.password ? (
              <p id="reset-password-error" className="text-xs text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-confirm-password">Confirm new password</Label>
            <Input
              id="reset-confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? "reset-confirm-password-error" : undefined}
              disabled={isSubmitting || !token}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword ? (
              <p id="reset-confirm-password-error" className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || !token}>
            {isSubmitting ? "Resetting password..." : "Reset password"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
