export type CertificationIssuer = "Amazon Web Services (AWS)" | "CompTIA" | "Microsoft";

export type CertificationLevel = "Foundational" | "Associate";

export interface CertificationTrackSummary {
  id: string;
  slug: string;
  title: string;
  targetCertification: string;
  issuer: CertificationIssuer;
  level: CertificationLevel;
  summary: string;
  availability: "Preview / Upcoming";
  isProvisional: true;
}

export interface CertificationTrackDetail extends CertificationTrackSummary {
  overview: string;
  audience: readonly string[];
  prerequisites: readonly string[];
  preparationTopics: readonly string[];
  learningPathway: readonly string[];
  relatedCourseSlug?: string;
  disclaimer: string;
}
