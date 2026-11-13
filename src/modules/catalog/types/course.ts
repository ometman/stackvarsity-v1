export type CourseCategory =
  | "AI & Automation"
  | "Cloud & Linux"
  | "Cybersecurity"
  | "Networking"
  | "Web Development"
  | "Data Analytics";

export type CourseLevel = "Beginner" | "Intermediate" | "Foundational";

export type CourseAvailability = "Free / Open" | "Paid (Coming Soon)" | "Preview / Upcoming";

export interface PublicCourseSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: CourseCategory;
  level: CourseLevel;
  modality: string;
  availability: CourseAvailability;
  isProvisional: boolean;
  accessType?: "FREE" | "PAID";
}

export interface PublicCourseDetail extends PublicCourseSummary {
  overview: string;
  intendedAudience: readonly string[];
  prerequisites: readonly string[];
  learningOutcomes: readonly string[];
  plannedModules: readonly string[];
  relatedCertificationSlug?: string;
}

export interface CatalogFilterInput {
  q?: string;
  category?: string;
  level?: string;
  page?: number;
}

export interface CatalogPageResult {
  items: PublicCourseSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  appliedFilters: {
    q: string;
    category: CourseCategory | "all";
    level: CourseLevel | "all";
  };
}
