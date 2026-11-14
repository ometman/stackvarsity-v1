import { describe, expect, it } from "vitest";
import {
  CertificationLifecycleStatus,
  SourceVerificationStatus,
  TrackAccessType,
  TrackAssignmentRole,
  TrackEnrollmentStatus,
} from "@/generated/prisma/enums";
import { SEED_CERTIFICATION_TRACKS } from "@/modules/certification/data/seed-fixtures";

describe("Phase 5 certification schema enums and fixtures", () => {
  it("exposes expected CertificationLifecycleStatus values", () => {
    expect(Object.values(CertificationLifecycleStatus)).toEqual([
      "DRAFT",
      "IN_REVIEW",
      "PUBLISHED",
      "RETIRED",
    ]);
  });

  it("exposes expected SourceVerificationStatus, TrackAccessType, TrackAssignmentRole, and TrackEnrollmentStatus values", () => {
    expect(Object.values(SourceVerificationStatus)).toEqual([
      "VERIFIED",
      "NEEDS_REVERIFICATION",
      "UNVERIFIED",
    ]);
    expect(Object.values(TrackAccessType)).toEqual(["FREE", "PAID"]);
    expect(Object.values(TrackAssignmentRole)).toEqual(["AUTHOR", "REVIEWER"]);
    expect(Object.values(TrackEnrollmentStatus)).toEqual([
      "ACTIVE",
      "COMPLETED",
      "PAUSED",
      "ARCHIVED",
    ]);
  });

  it("provides unique track slugs, source URLs, and independent disclaimers in seed fixtures", () => {
    const slugs = new Set(SEED_CERTIFICATION_TRACKS.map((item) => item.track.slug));
    expect(slugs.size).toBe(SEED_CERTIFICATION_TRACKS.length);

    for (const item of SEED_CERTIFICATION_TRACKS) {
      expect(item.examVersion.sourceUrl).toMatch(/^https:\/\//);
      expect(item.track.disclaimer.toLowerCase()).toContain("independent");
      expect(item.domains.length).toBeGreaterThan(0);
    }
  });
});
