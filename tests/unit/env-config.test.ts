import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "@/config/public-env";
import { parseServerEnv } from "@/config/server-env";

describe("Environment configuration validation", () => {
  it("applies safe defaults for public env when optional values are omitted", () => {
    const parsed = parsePublicEnv({});
    expect(parsed.NEXT_PUBLIC_APP_NAME).toBe("Stack Varsity");
    expect(parsed.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
    expect(parsed.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY).toBeUndefined();
  });

  it("rejects invalid public app URL", () => {
    expect(() => parsePublicEnv({ NEXT_PUBLIC_APP_URL: "not-a-url" })).toThrow(
      /Invalid public environment configuration/
    );
  });

  it("allows optional future-phase server variables to be empty", () => {
    const parsed = parseServerEnv({
      NODE_ENV: "test",
      DATABASE_URL: "",
      AUTH_SECRET: "",
      PAYSTACK_SECRET_KEY: "",
    });
    expect(parsed.NODE_ENV).toBe("test");
    expect(parsed.DATABASE_URL).toBeUndefined();
    expect(parsed.AUTH_SECRET).toBeUndefined();
  });

  it("rejects invalid DATABASE_URL protocol and short AUTH_SECRET", () => {
    expect(() => parseServerEnv({ DATABASE_URL: "mysql://localhost/db" })).toThrow(/postgresql/);
    expect(() => parseServerEnv({ AUTH_SECRET: "too-short" })).toThrow(/at least 32 characters/);
  });
});
