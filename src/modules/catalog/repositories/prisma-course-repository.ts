import "server-only";
import type { PrismaClient } from "@/generated/prisma/client";
import type { CourseCatalogRepository } from "@/modules/catalog/repositories/course-repository";
import type {
  CourseCategory,
  CourseLevel,
  PublicCourseDetail,
} from "@/modules/catalog/types/course";
import { getDb } from "@/server/db";

const VALID_CATEGORIES: readonly CourseCategory[] = [
  "AI & Automation",
  "Cloud & Linux",
  "Cybersecurity",
  "Networking",
  "Web Development",
  "Data Analytics",
];

const VALID_LEVELS: readonly CourseLevel[] = ["Beginner", "Intermediate", "Foundational"];

function normalizeCategory(value: string): CourseCategory {
  return VALID_CATEGORIES.includes(value as CourseCategory)
    ? (value as CourseCategory)
    : "AI & Automation";
}

function normalizeLevel(value: string): CourseLevel {
  return VALID_LEVELS.includes(value as CourseLevel) ? (value as CourseLevel) : "Beginner";
}

interface PrismaCourseWithModules {
  id: string;
  slug: string;
  title: string;
  summary: string;
  overview: string;
  category: string;
  level: string;
  modality: string;
  accessType: "FREE" | "PAID";
  intendedAudience: string[];
  prerequisites: string[];
  learningOutcomes: string[];
  relatedCertificationSlug: string | null;
  modules: Array<{ title: string }>;
}

function toPublicCourseDetail(course: PrismaCourseWithModules): PublicCourseDetail {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    overview: course.overview,
    category: normalizeCategory(course.category),
    level: normalizeLevel(course.level),
    modality: course.modality,
    availability: course.accessType === "FREE" ? "Free / Open" : "Paid (Coming Soon)",
    isProvisional: false,
    accessType: course.accessType,
    intendedAudience: course.intendedAudience,
    prerequisites: course.prerequisites,
    learningOutcomes: course.learningOutcomes,
    plannedModules: course.modules.map((mod) => mod.title),
    relatedCertificationSlug: course.relatedCertificationSlug ?? undefined,
  };
}

/**
 * PostgreSQL/Prisma-backed repository for public course discovery.
 * Strictly returns only PUBLISHED, non-archived courses.
 */
export class PrismaCourseCatalogRepository implements CourseCatalogRepository {
  constructor(private readonly dbProvider: () => PrismaClient = getDb) {}

  async listAll(): Promise<readonly PublicCourseDetail[]> {
    const db = this.dbProvider();
    const courses = await db.course.findMany({
      where: {
        status: "PUBLISHED",
        archivedAt: null,
      },
      include: {
        modules: {
          where: { archivedAt: null },
          orderBy: { position: "asc" },
          select: { title: true },
        },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });

    return courses.map(toPublicCourseDetail);
  }

  async findBySlug(slug: string): Promise<PublicCourseDetail | null> {
    const db = this.dbProvider();
    const course = await db.course.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
        archivedAt: null,
      },
      include: {
        modules: {
          where: { archivedAt: null },
          orderBy: { position: "asc" },
          select: { title: true },
        },
      },
    });

    return course ? toPublicCourseDetail(course) : null;
  }
}
