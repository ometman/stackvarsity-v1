export type CertificationIssuer = string;

export type CertificationLevel = string;

export interface CertificationDomainObjectiveSummary {
  id: string;
  objectiveKey: string;
  title: string;
  summary: string | null;
}

export interface CertificationDomainSummary {
  id: string;
  domainKey: string;
  title: string;
  description: string | null;
  weightMinPercent: number | null;
  weightMaxPercent: number | null;
  objectives: CertificationDomainObjectiveSummary[];
}

export interface CertificationTrackSummary {
  id: string;
  slug: string;
  title: string;
  targetCertification: string;
  issuer: CertificationIssuer;
  level: CertificationLevel;
  summary: string;
  availability: string;
  isProvisional: boolean;
  examCode?: string;
  versionLabel?: string;
  accessType?: "FREE" | "PAID";
}

export interface CertificationTrackDetail extends CertificationTrackSummary {
  overview: string;
  audience: readonly string[];
  prerequisites: readonly string[];
  preparationTopics: readonly string[];
  learningPathway: readonly string[];
  relatedCourseSlug?: string;
  disclaimer: string;
  sourceUrl?: string | null;
  verifiedAt?: string | null;
  lastReviewedAt?: string | null;
  trademarkNotice?: string | null;
  domains?: readonly CertificationDomainSummary[];
}
