import { describe, expect, it } from "vitest";
import { AuditOutcome, UserRole, UserStatus } from "@/generated/prisma/enums";

describe("Identity schema enums", () => {
  it("exposes expected UserRole values", () => {
    expect(UserRole.STUDENT).toBe("STUDENT");
    expect(UserRole.INSTRUCTOR).toBe("INSTRUCTOR");
    expect(UserRole.ADMIN).toBe("ADMIN");
    expect(Object.values(UserRole)).toEqual(["STUDENT", "INSTRUCTOR", "ADMIN"]);
  });

  it("exposes expected UserStatus values", () => {
    expect(UserStatus.ACTIVE).toBe("ACTIVE");
    expect(UserStatus.SUSPENDED).toBe("SUSPENDED");
    expect(UserStatus.DISABLED).toBe("DISABLED");
    expect(Object.values(UserStatus)).toEqual(["ACTIVE", "SUSPENDED", "DISABLED"]);
  });

  it("exposes expected AuditOutcome values", () => {
    expect(AuditOutcome.SUCCESS).toBe("SUCCESS");
    expect(AuditOutcome.FAILURE).toBe("FAILURE");
    expect(AuditOutcome.DENIED).toBe("DENIED");
  });
});
