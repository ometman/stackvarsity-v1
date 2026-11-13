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
import { registerSchema, type RegisterInput } from "@/modules/auth/registration-schema";

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setServerError(data.error ?? "Registration failed. Please check your details.");
        return;
      }

      setSuccessMessage(
        data.message ??
          "Account created successfully. Please check your email to verify your account."
      );
      reset();
    } catch {
      setServerError("Network error while creating your account. Please try again.");
    }
  }

  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          <h1>Create your account</h1>
        </CardTitle>
        <CardDescription>
          Join Stack Varsity as a student to access courses and certification prep.
        </CardDescription>
      </CardHeader>

      <CardContent>
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
          <div className="space-y-2">
            <Label htmlFor="register-name">Full name</Label>
            <Input
              id="register-name"
              type="text"
              autoComplete="name"
              placeholder="Ada Lovelace"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "register-name-error" : undefined}
              disabled={isSubmitting}
              {...register("name")}
            />
            {errors.name ? (
              <p id="register-name-error" className="text-xs text-destructive">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-email">Email address</Label>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="ada@example.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "register-email-error" : undefined}
              disabled={isSubmitting}
              {...register("email")}
            />
            {errors.email ? (
              <p id="register-email-error" className="text-xs text-destructive">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-password">Password</Label>
            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimum 10 characters"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? "register-password-error" : "register-password-help"
              }
              disabled={isSubmitting}
              {...register("password")}
            />
            <p id="register-password-help" className="text-xs text-muted-foreground">
              Use 10+ characters with uppercase, lowercase, number, and symbol.
            </p>
            {errors.password ? (
              <p id="register-password-error" className="text-xs text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-confirm-password">Confirm password</Label>
            <Input
              id="register-confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword ? "register-confirm-password-error" : undefined
              }
              disabled={isSubmitting}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword ? (
              <p id="register-confirm-password-error" className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create student account"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        <span>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}
