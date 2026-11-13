import { beforeEach, describe, expect, it, vi } from "vitest";

const checkDatabaseConnectionMock = vi.fn();

vi.mock("@/server/db", () => ({
  checkDatabaseConnection: checkDatabaseConnectionMock,
}));

vi.mock("@/server/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Health and readiness endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /api/health returns 200 and safe status payload", async () => {
    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "ok",
      service: "stackvarsity",
      timestamp: expect.any(String),
    });
    expect(Number.isNaN(Date.parse(String(body.timestamp)))).toBe(false);
    expect(Object.keys(body)).toEqual(["status", "service", "timestamp"]);
  });

  it("GET /api/ready returns 200 when PostgreSQL connectivity succeeds", async () => {
    checkDatabaseConnectionMock.mockResolvedValueOnce({ ok: true });
    const { GET } = await import("@/app/api/ready/route");
    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "ok",
      service: "stackvarsity",
      timestamp: expect.any(String),
    });
  });

  it("GET /api/ready returns 503 and hides internal details when database check fails", async () => {
    checkDatabaseConnectionMock.mockRejectedValueOnce(
      new Error("postgresql://secret:pass@localhost:5432/db connection refused")
    );
    const { GET } = await import("@/app/api/ready/route");
    const response = await GET();
    const body = (await response.json()) as Record<string, unknown>;
    const raw = JSON.stringify(body);

    expect(response.status).toBe(503);
    expect(body).toEqual({
      status: "unavailable",
      service: "stackvarsity",
      timestamp: expect.any(String),
    });
    expect(raw).not.toContain("postgresql://");
    expect(raw).not.toContain("secret");
    expect(raw).not.toContain("connection refused");
    expect(Object.keys(body)).toEqual(["status", "service", "timestamp"]);
  });
});
