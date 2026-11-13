// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContactForm } from "@/modules/contact/components/contact-form";
import { submitContactInquiry } from "@/modules/contact/services/contact-service";
import { getRateLimiter } from "@/server/rate-limit";

const sendEmailMock = vi.fn();

vi.mock("@/server/mail", () => ({
  sendTransactionalEmail: (...args: unknown[]) => sendEmailMock(...args),
}));

describe("Contact inquiry service and form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRateLimiter().clearAll();
  });

  it("validates input and rejects missing consent or invalid fields", async () => {
    const result = await submitContactInquiry(
      {
        name: "A",
        email: "invalid",
        topic: "General Inquiry",
        message: "Too short",
        consent: false,
      },
      "127.0.0.1"
    );
    expect(result.ok).toBe(false);
    expect(result.statusCode).toBe(400);
    expect(result.fieldErrors?.email).toBeDefined();
    expect(result.fieldErrors?.consent).toBeDefined();
  });

  it("blocks honeypot submissions without calling email delivery", async () => {
    const result = await submitContactInquiry(
      {
        name: "Ada Lovelace",
        email: "ada@example.com",
        topic: "General Inquiry",
        message: "Hello, I have a question about upcoming courses.",
        consent: true,
        website: "https://spam.example.com",
      },
      "127.0.0.1"
    );
    expect(result.ok).toBe(false);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("returns honest local-capture status when no external email provider is configured", async () => {
    sendEmailMock.mockResolvedValue({ delivered: true, provider: "local-capture" });

    const result = await submitContactInquiry(
      {
        name: "Kwame Mensah",
        email: "kwame@example.com",
        topic: "Course Information",
        message: "When will Cloud Computing Foundations open for learners?",
        consent: true,
      },
      "10.0.0.1"
    );

    expect(result.ok).toBe(true);
    expect(result.statusCode).toBe(202);
    expect(result.deliveryMode).toBe("local-capture");
    expect(result.message).toMatch(/local development mail sink/i);
  });

  it("enforces rate limiting after repeated submissions from the same IP", async () => {
    sendEmailMock.mockResolvedValue({ delivered: true, provider: "resend" });
    const payload = {
      name: "Kwame Mensah",
      email: "kwame@example.com",
      topic: "General Inquiry",
      message: "Checking rate limit enforcement for contact endpoint.",
      consent: true,
    };

    for (let i = 0; i < 5; i += 1) {
      const res = await submitContactInquiry(payload, "10.0.0.2");
      expect(res.ok).toBe(true);
    }

    const blocked = await submitContactInquiry(payload, "10.0.0.2");
    expect(blocked.ok).toBe(false);
    expect(blocked.statusCode).toBe(429);
  });

  it("submits ContactForm and announces server response accessibly", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        deliveryMode: "local-capture",
        message: "Captured locally for review.",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ContactForm />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Ama Boateng" } });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "ama@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "Interested in the upcoming AWS Cloud Practitioner prep track." },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /send inquiry/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/captured locally/i);
    });

    vi.unstubAllGlobals();
  });
});
