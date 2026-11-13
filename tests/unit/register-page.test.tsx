// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import RegisterPage from "@/app/(auth)/register/page";

describe("Register page", () => {
  it("renders accessible registration fields and shows validation errors on empty submit", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    expect(screen.getByRole("heading", { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /create student account/i }));

    expect(await screen.findByText(/full name must be at least 2 characters/i)).toBeInTheDocument();
  });
});
