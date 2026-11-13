"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CONTACT_TOPICS } from "@/modules/contact/schemas/contact-schema";

interface ContactResponsePayload {
  ok: boolean;
  deliveryMode?: "resend" | "local-capture";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<string>(CONTACT_TOPICS[0]);
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "local" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setStatusMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          topic,
          message,
          consent,
          website,
        }),
      });

      const data = (await response.json()) as ContactResponsePayload;

      if (!response.ok || !data.ok) {
        setFieldErrors(data.fieldErrors ?? {});
        setStatusMessage({
          type: "error",
          text: data.message || "Unable to submit your inquiry. Please try again.",
        });
        return;
      }

      setStatusMessage({
        type: data.deliveryMode === "local-capture" ? "local" : "success",
        text: data.message,
      });
      setName("");
      setEmail("");
      setMessage("");
      setConsent(false);
      setWebsite("");
    } catch {
      setStatusMessage({
        type: "error",
        text: "Network error while submitting your inquiry. Please email hello@mystackvarsity.com directly.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {statusMessage ? (
        <div
          role={statusMessage.type === "error" ? "alert" : "status"}
          className={`rounded-md border p-4 text-sm ${
            statusMessage.type === "error"
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : "border-border bg-muted/50 text-foreground"
          }`}
        >
          {statusMessage.text}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Full name</Label>
          <Input
            id="contact-name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(fieldErrors.name?.length)}
            aria-describedby={fieldErrors.name?.length ? "contact-name-error" : undefined}
          />
          {fieldErrors.name?.[0] ? (
            <p id="contact-name-error" className="text-xs text-destructive">
              {fieldErrors.name[0]}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="contact-email">Email address</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(fieldErrors.email?.length)}
            aria-describedby={fieldErrors.email?.length ? "contact-email-error" : undefined}
          />
          {fieldErrors.email?.[0] ? (
            <p id="contact-email-error" className="text-xs text-destructive">
              {fieldErrors.email[0]}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-topic">Topic</Label>
        <select
          id="contact-topic"
          name="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {CONTACT_TOPICS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Message</Label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={Boolean(fieldErrors.message?.length)}
          aria-describedby={fieldErrors.message?.length ? "contact-message-error" : undefined}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {fieldErrors.message?.[0] ? (
          <p id="contact-message-error" className="text-xs text-destructive">
            {fieldErrors.message[0]}
          </p>
        ) : null}
      </div>

      {/* Honeypot field hidden from human users */}
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="contact-website">Website</Label>
        <Input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <input
            id="contact-consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            aria-invalid={Boolean(fieldErrors.consent?.length)}
            className="mt-1 h-4 w-4 rounded border-input"
          />
          <span>
            I understand my inquiry will be used solely to respond to this request, and I have
            reviewed the{" "}
            <Link
              href="/privacy"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Privacy Policy (Draft)
            </Link>
            .
          </span>
        </label>
        {fieldErrors.consent?.[0] ? (
          <p className="text-xs text-destructive">{fieldErrors.consent[0]}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Sending..." : "Send inquiry"}
      </Button>
    </form>
  );
}
