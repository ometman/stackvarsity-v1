import { describe, expect, it } from "vitest";
import {
  CourseAccessType,
  CourseStatus,
  EnrollmentSource,
  EnrollmentStatus,
  LessonType,
} from "@/generated/prisma/enums";

describe("LMS schema enums", () => {
  it("exposes expected CourseStatus lifecycle values", () => {
    expect(Object.values(CourseStatus)).toEqual([
      "DRAFT",
      "IN_REVIEW",
      "APPROVED",
      "PUBLISHED",
      "ARCHIVED",
    ]);
  });

  it("exposes expected CourseAccessType values", () => {
    expect(Object.values(CourseAccessType)).toEqual(["FREE", "PAID"]);
  });

  it("exposes expected LessonType values", () => {
    expect(Object.values(LessonType)).toEqual(["TEXT", "VIDEO", "RESOURCE"]);
  });

  it("exposes expected EnrollmentStatus and EnrollmentSource values", () => {
    expect(Object.values(EnrollmentStatus)).toEqual(["ACTIVE", "COMPLETED", "REVOKED"]);
    expect(Object.values(EnrollmentSource)).toEqual(["FREE", "ADMIN_GRANTED", "PAID"]);
  });
});
