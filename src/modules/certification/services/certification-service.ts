import {
  defaultCertificationCatalogRepository,
  type CertificationCatalogRepository,
} from "@/modules/certification/repositories/prisma-certification-repository";
import { certificationFilterSchema } from "@/modules/certification/schemas/certification-query";
import type {
  CertificationTrackDetail,
  CertificationTrackSummary,
} from "@/modules/certification/types/certification";

function toSummary(track: CertificationTrackDetail): CertificationTrackSummary {
  return {
    id: track.id,
    slug: track.slug,
    title: track.title,
    targetCertification: track.targetCertification,
    issuer: track.issuer,
    level: track.level,
    summary: track.summary,
    availability: track.availability,
    isProvisional: track.isProvisional,
    examCode: track.examCode,
    versionLabel: track.versionLabel,
    accessType: track.accessType,
  };
}

export interface CertificationTrackQuery {
  issuer?: string;
  level?: string;
  q?: string;
}

export async function listCertificationTracks(
  filterOrIssuer?: string | CertificationTrackQuery,
  repository: CertificationCatalogRepository = defaultCertificationCatalogRepository
): Promise<CertificationTrackSummary[]> {
  const rawInput =
    typeof filterOrIssuer === "string"
      ? { issuer: filterOrIssuer }
      : (filterOrIssuer ?? {});

  const parsed = certificationFilterSchema.safeParse(rawInput);
  const filters = parsed.success
    ? parsed.data
    : { issuer: "all", level: "all", q: "" };

  const allTracks = await repository.listPublished();
  const normalizedQuery = filters.q.toLowerCase();

  const filtered = allTracks.filter((track) => {
    if (filters.issuer !== "all" && track.issuer !== filters.issuer) {
      return false;
    }
    if (filters.level !== "all" && track.level !== filters.level) {
      return false;
    }
    if (normalizedQuery) {
      const searchable =
        `${track.title} ${track.targetCertification} ${track.issuer} ${track.summary} ${track.examCode ?? ""}`.toLowerCase();
      if (!searchable.includes(normalizedQuery)) {
        return false;
      }
    }
    return true;
  });

  return filtered.map(toSummary);
}

export async function getCertificationTrackBySlug(
  slug: string,
  repository: CertificationCatalogRepository = defaultCertificationCatalogRepository
): Promise<CertificationTrackDetail | null> {
  if (!slug || typeof slug !== "string") {
    return null;
  }
  return repository.findPublishedBySlug(slug.trim());
}

export async function listCertificationSlugs(
  repository: CertificationCatalogRepository = defaultCertificationCatalogRepository
): Promise<string[]> {
  return repository.listPublishedSlugs();
}
