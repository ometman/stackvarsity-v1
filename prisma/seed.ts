import { existsSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { SEED_CERTIFICATION_TRACKS } from "../src/modules/certification/data/seed-fixtures";

if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
} else if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to run development seed in production.");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required to run prisma/seed.ts.");
  process.exit(1);
}

const pool = new Pool({ connectionString, max: 5 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

interface SeedLesson {
  slug: string;
  title: string;
  type: "TEXT" | "VIDEO" | "RESOURCE";
  content: string;
  estimatedMinutes: number;
  position: number;
  resources?: Array<{
    title: string;
    url: string;
    resourceType: string;
    position: number;
  }>;
}

interface SeedModule {
  title: string;
  description: string;
  position: number;
  lessons: SeedLesson[];
}

interface SeedCourse {
  slug: string;
  title: string;
  summary: string;
  overview: string;
  category: string;
  level: string;
  intendedAudience: string[];
  prerequisites: string[];
  learningOutcomes: string[];
  relatedCertificationSlug?: string;
  modules: SeedModule[];
}

const SEED_COURSES: SeedCourse[] = [
  {
    slug: "ai-literacy-and-practical-workflows",
    title: "AI Literacy & Practical Workflows",
    summary:
      "Foundational concepts for understanding modern AI systems, prompt discipline, and responsible workplace adoption.",
    overview:
      "Designed for beginners and non-specialist professionals, this free introductory course explains how generative AI tools work, where they fail, and how to apply structured verification in everyday study and office workflows.",
    category: "AI & Automation",
    level: "Beginner",
    intendedAudience: [
      "Students and recent graduates building digital fluency",
      "Working professionals adopting AI tools responsibly",
      "Career changers exploring technology fundamentals",
    ],
    prerequisites: [
      "Basic computer and web browser literacy",
      "No prior programming experience required",
    ],
    learningOutcomes: [
      "Explain core concepts behind large language models and common limitations",
      "Write clear, structured prompts with verification steps",
      "Identify privacy, accuracy, and intellectual property considerations",
    ],
    modules: [
      {
        title: "Module 1: How Modern AI Systems Work",
        description: "Understand tokens, context windows, and probabilistic outputs.",
        position: 1,
        lessons: [
          {
            slug: "what-large-language-models-do",
            title: "What Large Language Models Actually Do",
            type: "TEXT",
            estimatedMinutes: 8,
            position: 1,
            content: [
              "## Prediction, Not Magic",
              "",
              "Large language models (LLMs) generate responses by predicting the next token based on patterns learned during training and the context you provide.",
              "",
              "### Key Takeaways",
              "- Models do not verify facts automatically; they optimize for plausible continuation.",
              "- Clear context and constraints dramatically improve output reliability.",
              "- Always treat generated claims, citations, and code as drafts requiring human review.",
            ].join("\n"),
            resources: [
              {
                title: "NIST AI Risk Management Framework Overview",
                url: "https://www.nist.gov/itl/ai-risk-management-framework",
                resourceType: "LINK",
                position: 1,
              },
            ],
          },
          {
            slug: "recognizing-hallucinations-and-gaps",
            title: "Recognizing Hallucinations & Knowledge Gaps",
            type: "TEXT",
            estimatedMinutes: 7,
            position: 2,
            content: [
              "## Why Models Confidently Make Mistakes",
              "",
              "When a prompt asks for obscure facts, recent events, or exact citations, an LLM may produce fluent but fabricated details.",
              "",
              "### Verification Checklist",
              "1. Check primary sources before sharing any statistic or quote.",
              "2. Ask the model to separate known facts from assumptions.",
              "3. Never paste confidential or regulated data into unapproved tools.",
            ].join("\n"),
          },
        ],
      },
      {
        title: "Module 2: Structured Prompting & Verification",
        description: "Practical patterns for repeatable, verifiable AI-assisted work.",
        position: 2,
        lessons: [
          {
            slug: "the-role-context-constraint-pattern",
            title: "The Role, Context, and Constraint Pattern",
            type: "TEXT",
            estimatedMinutes: 10,
            position: 1,
            content: [
              "## Writing Prompts That Hold Up",
              "",
              "Effective prompts specify four elements: **Goal**, **Audience/Context**, **Constraints**, and **Output Format**.",
              "",
              "### Example Template",
              "- **Goal:** Summarize the meeting notes into action items.",
              "- **Context:** Engineering onboarding sync.",
              "- **Constraints:** Only include items explicitly mentioned; mark owners as TBD if unnamed.",
            ].join("\n"),
          },
        ],
      },
    ],
  },
  {
    slug: "cloud-computing-foundations",
    title: "Cloud Computing Foundations",
    summary:
      "Core cloud architecture concepts covering compute, storage, networking, identity, and shared responsibility.",
    overview:
      "An introductory path explaining how cloud infrastructure operates, how organizations evaluate cloud services, and how core security and cost concepts fit together.",
    category: "Cloud & Linux",
    level: "Beginner",
    intendedAudience: [
      "Aspiring cloud practitioners and IT support learners",
      "Developers wanting a structured foundation in cloud concepts",
    ],
    prerequisites: ["General familiarity with operating systems and the internet"],
    learningOutcomes: [
      "Distinguish IaaS, PaaS, and SaaS delivery models",
      "Describe virtual compute, object storage, and virtual networks",
      "Apply the shared responsibility model to basic cloud workloads",
    ],
    relatedCertificationSlug: "aws-cloud-practitioner-prep",
    modules: [
      {
        title: "Module 1: Cloud Concepts & Service Models",
        description: "Compare on-premises infrastructure with IaaS, PaaS, and SaaS.",
        position: 1,
        lessons: [
          {
            slug: "iaas-paas-and-saas-explained",
            title: "IaaS, PaaS, and SaaS Explained",
            type: "TEXT",
            estimatedMinutes: 9,
            position: 1,
            content: [
              "## Cloud Service Models",
              "",
              "Cloud platforms shift operational responsibilities from your team to the provider depending on the abstraction layer.",
              "",
              "- **IaaS (Infrastructure as a Service):** Virtual machines, virtual networks, and block storage.",
              "- **PaaS (Platform as a Service):** Managed runtimes and databases where you deploy application code.",
              "- **SaaS (Software as a Service):** Complete applications delivered over the web.",
            ].join("\n"),
          },
          {
            slug: "shared-responsibility-model",
            title: "The Shared Responsibility Model",
            type: "TEXT",
            estimatedMinutes: 8,
            position: 2,
            content: [
              "## Security OF the Cloud vs. Security IN the Cloud",
              "",
              "Cloud providers secure physical data centers, hardware, and virtualization layers. Customers remain responsible for identity configuration, data encryption, network rules, and application security.",
            ].join("\n"),
          },
        ],
      },
    ],
  },
];

async function main() {
  const demoInstructor = await prisma.user.upsert({
    where: { email: "instructor.demo@mystackvarsity.com" },
    update: {},
    create: {
      email: "instructor.demo@mystackvarsity.com",
      name: "Stack Varsity Curriculum Team",
      role: "INSTRUCTOR",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  for (const courseData of SEED_COURSES) {
    const course = await prisma.course.upsert({
      where: { slug: courseData.slug },
      update: {
        title: courseData.title,
        summary: courseData.summary,
        overview: courseData.overview,
        category: courseData.category,
        level: courseData.level,
        status: "PUBLISHED",
        accessType: "FREE",
        intendedAudience: courseData.intendedAudience,
        prerequisites: courseData.prerequisites,
        learningOutcomes: courseData.learningOutcomes,
        relatedCertificationSlug: courseData.relatedCertificationSlug ?? null,
        publishedAt: new Date(),
      },
      create: {
        slug: courseData.slug,
        title: courseData.title,
        summary: courseData.summary,
        overview: courseData.overview,
        category: courseData.category,
        level: courseData.level,
        status: "PUBLISHED",
        accessType: "FREE",
        intendedAudience: courseData.intendedAudience,
        prerequisites: courseData.prerequisites,
        learningOutcomes: courseData.learningOutcomes,
        relatedCertificationSlug: courseData.relatedCertificationSlug ?? null,
        publishedAt: new Date(),
        createdById: demoInstructor.id,
      },
    });

    await prisma.instructorAssignment.upsert({
      where: {
        courseId_userId: {
          courseId: course.id,
          userId: demoInstructor.id,
        },
      },
      update: {},
      create: {
        courseId: course.id,
        userId: demoInstructor.id,
        assignedById: demoInstructor.id,
      },
    });

    const existingModules = await prisma.courseModule.count({
      where: { courseId: course.id },
    });

    if (existingModules === 0) {
      for (const mod of courseData.modules) {
        const createdModule = await prisma.courseModule.create({
          data: {
            courseId: course.id,
            title: mod.title,
            description: mod.description,
            position: mod.position,
          },
        });

        for (const lesson of mod.lessons) {
          const createdLesson = await prisma.lesson.create({
            data: {
              moduleId: createdModule.id,
              slug: lesson.slug,
              title: lesson.title,
              type: lesson.type,
              content: lesson.content,
              estimatedMinutes: lesson.estimatedMinutes,
              position: lesson.position,
              isPublished: true,
            },
          });

          if (lesson.resources && lesson.resources.length > 0) {
            await prisma.lessonResource.createMany({
              data: lesson.resources.map((res) => ({
                lessonId: createdLesson.id,
                title: res.title,
                url: res.url,
                resourceType: res.resourceType,
                position: res.position,
              })),
            });
          }
        }
      }
    }
  }

  console.log(`Seeded ${SEED_COURSES.length} development LMS courses.`);

  for (const item of SEED_CERTIFICATION_TRACKS) {
    const provider = await prisma.certificationProvider.upsert({
      where: { slug: item.provider.slug },
      update: {},
      create: {
        slug: item.provider.slug,
        name: item.provider.name,
        officialHomepageUrl: item.provider.officialHomepageUrl,
        trademarkNotice: item.provider.trademarkNotice,
        isActive: true,
      },
    });

    const certification = await prisma.certification.upsert({
      where: { slug: item.certification.slug },
      update: {},
      create: {
        providerId: provider.id,
        slug: item.certification.slug,
        name: item.certification.name,
        level: item.certification.level,
        summary: item.certification.summary,
        isActive: true,
      },
    });

    const examVersion = await prisma.examVersion.upsert({
      where: {
        certificationId_examCode_versionLabel: {
          certificationId: certification.id,
          examCode: item.examVersion.examCode,
          versionLabel: item.examVersion.versionLabel,
        },
      },
      update: {},
      create: {
        certificationId: certification.id,
        examCode: item.examVersion.examCode,
        versionLabel: item.examVersion.versionLabel,
        status: "PUBLISHED",
        sourceUrl: item.examVersion.sourceUrl,
        verifiedAt: new Date("2026-11-14T00:00:00.000Z"),
        verificationStatus: "VERIFIED",
        sourceNotes: item.examVersion.sourceNotes,
      },
    });

    const existingTrack = await prisma.preparationTrack.findUnique({
      where: { slug: item.track.slug },
      select: { id: true },
    });

    const track =
      existingTrack ??
      (await prisma.preparationTrack.create({
        data: {
          examVersionId: examVersion.id,
          slug: item.track.slug,
          title: item.track.title,
          summary: item.track.summary,
          overview: item.track.overview,
          accessType: "FREE",
          status: "PUBLISHED",
          intendedAudience: item.track.intendedAudience,
          prerequisites: item.track.prerequisites,
          disclaimer: item.track.disclaimer,
          publishedAt: new Date(),
          lastReviewedAt: new Date(),
          createdById: demoInstructor.id,
        },
      }));

    await prisma.trackAssignment.upsert({
      where: {
        trackId_userId_role: {
          trackId: track.id,
          userId: demoInstructor.id,
          role: "AUTHOR",
        },
      },
      update: {},
      create: {
        trackId: track.id,
        userId: demoInstructor.id,
        role: "AUTHOR",
        assignedById: demoInstructor.id,
      },
    });

    const existingDomains = await prisma.examDomain.count({
      where: { examVersionId: examVersion.id },
    });

    let firstObjectiveId: string | null = null;
    if (existingDomains === 0) {
      for (const dom of item.domains) {
        const domain = await prisma.examDomain.create({
          data: {
            examVersionId: examVersion.id,
            domainKey: dom.domainKey,
            title: dom.title,
            description: dom.description,
            weightMinPercent: dom.weightMinPercent ?? null,
            weightMaxPercent: dom.weightMaxPercent ?? null,
            position: dom.position,
          },
        });

        for (const obj of dom.objectives) {
          const createdObj = await prisma.examObjective.create({
            data: {
              examVersionId: examVersion.id,
              domainId: domain.id,
              objectiveKey: obj.objectiveKey,
              title: obj.title,
              summary: obj.summary,
              sourceReference: obj.sourceReference,
              position: obj.position,
            },
          });
          if (!firstObjectiveId) {
            firstObjectiveId = createdObj.id;
          }
        }
      }
    }

    if (firstObjectiveId && item.track.relatedCourseSlug) {
      const relatedCourse = await prisma.course.findUnique({
        where: { slug: item.track.relatedCourseSlug },
        select: { id: true },
      });
      if (relatedCourse) {
        const existingMapCount = await prisma.objectiveResourceMapping.count({
          where: { trackId: track.id, courseId: relatedCourse.id },
        });
        if (existingMapCount === 0) {
          await prisma.objectiveResourceMapping.create({
            data: {
              trackId: track.id,
              objectiveId: firstObjectiveId,
              courseId: relatedCourse.id,
              isRequired: true,
              position: 1,
              notes: "Foundational course aligned to this certification track.",
            },
          });
        }
      }
    }
  }

  console.log(`Seeded ${SEED_CERTIFICATION_TRACKS.length} certification preparation tracks.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
