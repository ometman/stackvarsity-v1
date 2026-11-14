import "server-only";
import type {
  CertificationDomainSummary,
  CertificationTrackDetail,
} from "@/modules/certification/types/certification";
import { getDb } from "@/server/db";

export interface CertificationCatalogRepository {
  listPublished(): Promise<CertificationTrackDetail[]>;
  findPublishedBySlug(slug: string): Promise<CertificationTrackDetail | null>;
  listPublishedSlugs(): Promise<string[]>;
}

const PUBLISHED_TRACK_WHERE = {
  status: "PUBLISHED" as const,
  archivedAt: null,
  examVersion: {
    status: "PUBLISHED" as const,
    certification: {
      isActive: true,
      provider: {
        isActive: true,
      },
    },
  },
};

function mapTrackToDetail(track: {
  id: string;
  slug: string;
  title: string;
  summary: string;
  overview: string;
  accessType: "FREE" | "PAID";
  intendedAudience: string[];
  prerequisites: string[];
  disclaimer: string;
  lastReviewedAt: Date | null;
  examVersion: {
    examCode: string;
    versionLabel: string;
    sourceUrl: string | null;
    verifiedAt: Date | null;
    certification: {
      name: string;
      level: string;
      provider: {
        name: string;
        trademarkNotice: string | null;
      };
    };
    domains: Array<{
      id: string;
      domainKey: string;
      title: string;
      description: string | null;
      weightMinPercent: number | null;
      weightMaxPercent: number | null;
      objectives: Array<{
        id: string;
        objectiveKey: string;
        title: string;
        summary: string | null;
      }>;
    }>;
  };
  resourceMappings: Array<{
    course: { slug: string; status: string; archivedAt: Date | null } | null;
  }>;
}): CertificationTrackDetail {
  const domains: CertificationDomainSummary[] = track.examVersion.domains.map((d) => ({
    id: d.id,
    domainKey: d.domainKey,
    title: d.title,
    description: d.description,
    weightMinPercent: d.weightMinPercent,
    weightMaxPercent: d.weightMaxPercent,
    objectives: d.objectives.map((o) => ({
      id: o.id,
      objectiveKey: o.objectiveKey,
      title: o.title,
      summary: o.summary,
    })),
  }));

  const relatedCourse = track.resourceMappings.find(
    (m) => m.course && m.course.status === "PUBLISHED" && m.course.archivedAt === null
  )?.course;

  return {
    id: track.id,
    slug: track.slug,
    title: track.title,
    targetCertification: `${track.examVersion.certification.name} (${track.examVersion.examCode})`,
    issuer: track.examVersion.certification.provider.name,
    level: track.examVersion.certification.level,
    summary: track.summary,
    overview: track.overview,
    availability:
      track.accessType === "FREE" ? "Free Preparation Track" : "Paid Preparation (Phase 7)",
    isProvisional: false,
    examCode: track.examVersion.examCode,
    versionLabel: track.examVersion.versionLabel,
    accessType: track.accessType,
    audience: track.intendedAudience,
    prerequisites: track.prerequisites,
    preparationTopics: domains.map((d) => d.title),
    learningPathway: [
      "Review verified exam domains and objective outlines",
      "Complete mapped Stack Varsity LMS lessons in your study workspace",
      "Check understanding with original formative practice items",
    ],
    relatedCourseSlug: relatedCourse?.slug,
    disclaimer: track.disclaimer,
    sourceUrl: track.examVersion.sourceUrl,
    verifiedAt: track.examVersion.verifiedAt?.toISOString() ?? null,
    lastReviewedAt: track.lastReviewedAt?.toISOString() ?? null,
    trademarkNotice: track.examVersion.certification.provider.trademarkNotice,
    domains,
  };
}

const TRACK_PUBLIC_INCLUDE = {
  examVersion: {
    include: {
      certification: {
        include: {
          provider: true,
        },
      },
      domains: {
        orderBy: { position: "asc" as const },
        include: {
          objectives: {
            orderBy: { position: "asc" as const },
          },
        },
      },
    },
  },
  resourceMappings: {
    where: { isStale: false },
    orderBy: { position: "asc" as const },
    include: {
      course: {
        select: { slug: true, status: true, archivedAt: true },
      },
    },
  },
};

export class PrismaCertificationCatalogRepository implements CertificationCatalogRepository {
  async listPublished(): Promise<CertificationTrackDetail[]> {
    const db = getDb();
    const tracks = await db.preparationTrack.findMany({
      where: PUBLISHED_TRACK_WHERE,
      include: TRACK_PUBLIC_INCLUDE,
      orderBy: [{ title: "asc" }],
    });
    return tracks.map(mapTrackToDetail);
  }

  async findPublishedBySlug(slug: string): Promise<CertificationTrackDetail | null> {
    const db = getDb();
    const track = await db.preparationTrack.findFirst({
      where: {
        slug,
        ...PUBLISHED_TRACK_WHERE,
      },
      include: TRACK_PUBLIC_INCLUDE,
    });
    return track ? mapTrackToDetail(track) : null;
  }

  async listPublishedSlugs(): Promise<string[]> {
    const db = getDb();
    const rows = await db.preparationTrack.findMany({
      where: PUBLISHED_TRACK_WHERE,
      select: { slug: true },
      orderBy: [{ slug: "asc" }],
    });
    return rows.map((r) => r.slug);
  }
}

export const defaultCertificationCatalogRepository: CertificationCatalogRepository =
  new PrismaCertificationCatalogRepository();
