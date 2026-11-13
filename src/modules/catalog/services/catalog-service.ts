import {
  defaultCourseCatalogRepository,
  type CourseCatalogRepository,
} from "@/modules/catalog/repositories/course-repository";
import { catalogQuerySchema } from "@/modules/catalog/schemas/catalog-query";
import type {
  CatalogFilterInput,
  CatalogPageResult,
  PublicCourseDetail,
  PublicCourseSummary,
} from "@/modules/catalog/types/course";

const DEFAULT_PAGE_SIZE = 6;

function toSummary(course: PublicCourseDetail): PublicCourseSummary {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    category: course.category,
    level: course.level,
    modality: course.modality,
    availability: course.availability,
    isProvisional: course.isProvisional,
  };
}

export async function queryPublicCatalog(
  input: CatalogFilterInput,
  repository: CourseCatalogRepository = defaultCourseCatalogRepository
): Promise<CatalogPageResult> {
  const parsed = catalogQuerySchema.safeParse(input);
  const filters = parsed.success
    ? parsed.data
    : { q: "", category: "all" as const, level: "all" as const, page: 1 };

  const allCourses = await repository.listAll();
  const normalizedQuery = filters.q.toLowerCase();

  const filtered = allCourses.filter((course) => {
    if (filters.category !== "all" && course.category !== filters.category) {
      return false;
    }
    if (filters.level !== "all" && course.level !== filters.level) {
      return false;
    }
    if (normalizedQuery) {
      const searchable = `${course.title} ${course.summary} ${course.category}`.toLowerCase();
      if (!searchable.includes(normalizedQuery)) {
        return false;
      }
    }
    return true;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));
  const safePage = Math.min(filters.page, totalPages);
  const start = (safePage - 1) * DEFAULT_PAGE_SIZE;
  const items = filtered.slice(start, start + DEFAULT_PAGE_SIZE).map(toSummary);

  return {
    items,
    total,
    page: safePage,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages,
    appliedFilters: {
      q: filters.q,
      category: filters.category,
      level: filters.level,
    },
  };
}

export async function getPublicCourseBySlug(
  slug: string,
  repository: CourseCatalogRepository = defaultCourseCatalogRepository
): Promise<PublicCourseDetail | null> {
  if (!slug || typeof slug !== "string") {
    return null;
  }
  return repository.findBySlug(slug.trim());
}

export async function listPublicCourseSlugs(
  repository: CourseCatalogRepository = defaultCourseCatalogRepository
): Promise<string[]> {
  const courses = await repository.listAll();
  return courses.map((course) => course.slug);
}
