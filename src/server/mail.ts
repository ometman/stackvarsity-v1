import "server-only";
import { publicEnv } from "@/config/public-env";
import { getServerEnv } from "@/config/server-env";
import { logger } from "@/server/logger";

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface EmailDeliveryResult {
  delivered: boolean;
  provider: "resend" | "local-capture";
}

/**
 * Reusable transactional email delivery abstraction.
 * Uses configured provider in production and a safe server-only local capture in development/test.
 * Never logs raw verification or reset tokens.
 */
export async function sendTransactionalEmail(input: SendEmailInput): Promise<EmailDeliveryResult> {
  const serverEnv = getServerEnv();
  const from = serverEnv.EMAIL_FROM ?? "Stack Varsity <hello@mystackvarsity.com>";

  if (serverEnv.EMAIL_PROVIDER_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serverEnv.EMAIL_PROVIDER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });

    if (!response.ok) {
      logger.error("Transactional email provider rejected request", {
        status: response.status,
      });
      throw new Error("Unable to send transactional email");
    }

    return { delivered: true, provider: "resend" };
  }

  logger.info("Transactional email captured locally (no EMAIL_PROVIDER_API_KEY configured)", {
    subject: input.subject,
    environment: serverEnv.NODE_ENV,
  });

  return { delivered: true, provider: "local-capture" };
}

/**
 * Builds the canonical application URL for transactional email links.
 */
export function getAppBaseUrl(): string {
  return publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
}
