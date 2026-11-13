import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { PrismaCourseCatalogRepository } from "@/modules/catalog/repositories/prisma-course-repository";

function createMockDb(courses: unknown[] = [], singleCourse: unknown = null) {
  const findMany = vi.fn().mockResolvedValue(courses);
  const findFirst = vi.fn().mockResolvedValue(singleCourse);
  const db = {
    course: {
      findMany,
      findFirst,
    },
  } as unknown as PrismaClient;

  return { db, findMany, findFirst };
}

describe("PrismaCourseCatalogRepository", () => {
  it("queries only PUBLISHED, non-archived courses and maps modules", async () => {
    const { db, findMany } = createMockDb([
      {
        id: "c1",
        slug: "cloud-computing-foundations",
        title: "Cloud Computing Foundations",
        summary: "Cloud basics",
        overview: "Full overview",
        category: "Cloud & Linux",
        level: "Beginner",
        modality: "Self-paced",
        accessType: "FREE",
        intendedAudience: ["Students"],
        prerequisites: ["None"],
        learningOutcomes: ["Understand IaaS"],
        relatedCertificationSlug: "aws-cloud-practitioner-prep",
        modules: [{ title: "Module 1: Cloud Concepts" }],
      },
    ]);

    const repo = new PrismaCourseCatalogRepository(() => db);
    const results = await repo.listAll();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "PUBLISHED", archivedAt: null },
      })
    );
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      slug: "cloud-computing-foundations",
      availability: "Free / Open",
      isProvisional: false,
      plannedModules: ["Module 1: Cloud Concepts"],
    });
  });

  it("handles empty database state gracefully", async () => {
    const { db } = createMockDb([]);
    const repo = new PrismaCourseCatalogRepository(() => db);

    const results = await repo.listAll();
    expect(results).toEqual([]);
  });

  it("returns null for unpublished or missing courses in findBySlug", async () => {
    const { db, findFirst } = createMockDb([], null);
    const repo = new PrismaCourseCatalogRepository(() => db);

    const result = await repo.findBySlug("draft-course");
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "draft-course", status: "PUBLISHED", archivedAt: null },
      })
    );
    expect(result).toBeNull();
  });
});
