import "server-only";
import { siteConfig } from "@/config/site";
import {
  contactSubmissionSchema,
  type ContactSubmissionInput,
} from "@/modules/contact/schemas/contact-schema";
import { logger } from "@/server/logger";
import { sendTransactionalEmail } from "@/server/mail";
import { getRateLimiter } from "@/server/rate-limit";

export interface ContactServiceResult {
  ok: boolean;
  statusCode: number;
  deliveryMode?: "resend" | "local-capture";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

const CONTACT_RATE_LIMIT = 5;
const CONTACT_RATE_WINDOW_MS = 15 * 60 * 1000;

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function submitContactInquiry(
  rawInput: unknown,
  clientIp: string
): Promise<ContactServiceResult> {
  const parsed = contactSubmissionSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      statusCode: 400,
      message: "Please correct the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const input: ContactSubmissionInput = parsed.data;

  // Reject automated bot submissions silently with a deterministic non-delivery response.
  if (input.website.trim().length > 0) {
    logger.warn("Contact inquiry blocked by honeypot check", { topic: input.topic });
    return {
      ok: false,
      statusCode: 400,
      message: "Unable to process submission. Please email hello@mystackvarsity.com directly.",
    };
  }

  const rateLimiter = getRateLimiter();
  const rateLimit = await rateLimiter.consume(
    `contact:${clientIp}`,
    CONTACT_RATE_LIMIT,
    CONTACT_RATE_WINDOW_MS
  );

  if (!rateLimit.allowed) {
    return {
      ok: false,
      statusCode: 429,
      message: `Too many inquiries submitted. Please try again in ${rateLimit.retryAfterSeconds} seconds or email ${siteConfig.contactEmail}.`,
    };
  }

  try {
    const emailResult = await sendTransactionalEmail({
      to: siteConfig.contactEmail,
      subject: `[Stack Varsity Contact] ${input.topic}`,
      text: [
        `Topic: ${input.topic}`,
        `From: ${input.name} <${input.email}>`,
        "",
        input.message,
      ].join("\n"),
      html: [
        `<p><strong>Topic:</strong> ${escapeHtml(input.topic)}</p>`,
        `<p><strong>From:</strong> ${escapeHtml(input.name)} (${escapeHtml(input.email)})</p>`,
        `<hr />`,
        `<p>${escapeHtml(input.message).replaceAll("\n", "<br />")}</p>`,
      ].join(""),
    });

    logger.info("Contact inquiry processed", {
      topic: input.topic,
      provider: emailResult.provider,
    });

    if (emailResult.provider === "local-capture") {
      return {
        ok: true,
        statusCode: 202,
        deliveryMode: "local-capture",
        message: `Your inquiry was validated and captured in the local development mail sink (live email delivery is not configured in this environment). For direct assistance, email ${siteConfig.contactEmail}.`,
      };
    }

    return {
      ok: true,
      statusCode: 200,
      deliveryMode: "resend",
      message: "Thank you. Your inquiry has been sent to our team.",
    };
  } catch {
    logger.error("Contact inquiry delivery failed", { topic: input.topic });
    return {
      ok: false,
      statusCode: 502,
      message: `We could not deliver your message right now. Please email ${siteConfig.contactEmail} directly.`,
    };
  }
}
