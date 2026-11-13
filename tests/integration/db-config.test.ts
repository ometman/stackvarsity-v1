import { describe, expect, it, vi } from "vitest";

describe("Database configuration guard", () => {
  it("throws a clear error when DATABASE_URL is missing", { timeout: 15000 }, async () => {
    const originalUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    vi.resetModules();

    try {
      const { getDb } = await import("@/server/db");
      expect(() => getDb()).toThrow(/Missing required server environment variable "DATABASE_URL"/);
    } finally {
      if (originalUrl !== undefined) {
        process.env.DATABASE_URL = originalUrl;
      }
    }
  });
});
