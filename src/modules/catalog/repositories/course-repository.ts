import { PrismaCourseCatalogRepository } from "@/modules/catalog/repositories/prisma-course-repository";
import type { PublicCourseDetail } from "@/modules/catalog/types/course";

/**
 * Replaceable repository interface for public course discovery.
 * Phase 3 uses a provisional static dataset; Phase 4 will swap in a Prisma-backed implementation.
 */
export interface CourseCatalogRepository {
  listAll(): Promise<readonly PublicCourseDetail[]>;
  findBySlug(slug: string): Promise<PublicCourseDetail | null>;
}

const PROVISIONAL_COURSES: readonly PublicCourseDetail[] = [
  {
    id: "prov-ai-literacy",
    slug: "ai-literacy-and-practical-workflows",
    title: "AI Literacy & Practical Workflows",
    summary:
      "Foundational concepts for understanding modern AI systems, prompt discipline, and responsible workplace adoption.",
    overview:
      "Designed for beginners and non-specialist professionals, this planned course introduces how generative AI tools work, where they fail, and how to apply structured verification in everyday study and office workflows.",
    category: "AI & Automation",
    level: "Beginner",
    modality: "Self-paced (planned)",
    availability: "Preview / Upcoming",
    isProvisional: true,
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
    plannedModules: [
      "Module 1: How Modern AI Systems Work",
      "Module 2: Structured Prompting & Verification",
      "Module 3: Responsible Use, Privacy & Quality Checks",
    ],
  },
  {
    id: "prov-cloud-foundations",
    slug: "cloud-computing-foundations",
    title: "Cloud Computing Foundations",
    summary:
      "Core cloud architecture concepts covering compute, storage, networking, identity, and shared responsibility.",
    overview:
      "An introductory path explaining how cloud infrastructure operates, how organizations evaluate cloud services, and how core security and cost concepts fit together.",
    category: "Cloud & Linux",
    level: "Beginner",
    modality: "Self-paced (planned)",
    availability: "Preview / Upcoming",
    isProvisional: true,
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
    plannedModules: [
      "Module 1: Cloud Concepts & Service Models",
      "Module 2: Core Compute, Storage & Networking",
      "Module 3: Identity, Security & Cost Awareness",
    ],
    relatedCertificationSlug: "aws-cloud-practitioner-prep",
  },
  {
    id: "prov-linux-essentials",
    slug: "linux-command-line-essentials",
    title: "Linux Command Line Essentials",
    summary:
      "Practical command-line navigation, file permissions, process inspection, and shell fundamentals for IT roles.",
    overview:
      "A hands-on foundational track focused on operating Linux environments confidently for cloud, networking, and cybersecurity roles.",
    category: "Cloud & Linux",
    level: "Beginner",
    modality: "Self-paced (planned)",
    availability: "Preview / Upcoming",
    isProvisional: true,
    intendedAudience: [
      "Beginners preparing for cloud, DevOps, or cybersecurity tracks",
      "IT students moving from GUI-only workflows to terminal operations",
    ],
    prerequisites: ["Basic familiarity with desktop file systems"],
    learningOutcomes: [
      "Navigate directories, inspect logs, and manage files safely from the shell",
      "Configure standard Unix users, groups, and file permissions",
      "Monitor running processes and troubleshoot basic service issues",
    ],
    plannedModules: [
      "Module 1: Shell Navigation & File Operations",
      "Module 2: Users, Groups & Permissions",
      "Module 3: Processes, Logs & Package Management",
    ],
  },
  {
    id: "prov-networking-fundamentals",
    slug: "computer-networking-fundamentals",
    title: "Computer Networking Fundamentals",
    summary:
      "Understand IP addressing, DNS, HTTP, routing basics, and practical network troubleshooting.",
    overview:
      "Covers how data moves across local networks and the internet, giving learners the mental models required for cloud infrastructure and security.",
    category: "Networking",
    level: "Foundational",
    modality: "Self-paced (planned)",
    availability: "Preview / Upcoming",
    isProvisional: true,
    intendedAudience: [
      "IT support and junior systems learners",
      "Candidates preparing for foundational networking or security certifications",
    ],
    prerequisites: ["Basic computer literacy"],
    learningOutcomes: [
      "Interpret IPv4/IPv6 addressing, subnetting basics, and gateways",
      "Explain DNS resolution, DHCP, and core TCP/UDP ports",
      "Use standard command-line tools to diagnose connectivity issues",
    ],
    plannedModules: [
      "Module 1: Network Models & Addressing",
      "Module 2: Core Protocols (DNS, DHCP, HTTP, TLS)",
      "Module 3: Switching, Routing & Troubleshooting",
    ],
    relatedCertificationSlug: "comptia-network-plus-prep",
  },
  {
    id: "prov-cybersecurity-foundations",
    slug: "cybersecurity-principles-and-hygiene",
    title: "Cybersecurity Principles & Hygiene",
    summary:
      "Core security concepts including threat awareness, identity protection, encryption basics, and defensive habits.",
    overview:
      "Introduces foundational security principles for learners entering IT security or strengthening operational awareness across software and cloud teams.",
    category: "Cybersecurity",
    level: "Foundational",
    modality: "Self-paced (planned)",
    availability: "Preview / Upcoming",
    isProvisional: true,
    intendedAudience: [
      "Early-career IT learners exploring cybersecurity",
      "Developers and analysts building defensive security literacy",
    ],
    prerequisites: ["Basic networking or operating system familiarity recommended"],
    learningOutcomes: [
      "Apply confidentiality, integrity, and availability principles",
      "Recognize common social engineering and credential-based risks",
      "Explain authentication controls, least privilege, and encryption use cases",
    ],
    plannedModules: [
      "Module 1: Security Fundamentals & Threat Landscape",
      "Module 2: Identity, Access & Cryptography Basics",
      "Module 3: Defensive Operations & Incident Awareness",
    ],
    relatedCertificationSlug: "comptia-security-plus-prep",
  },
  {
    id: "prov-web-dev-foundations",
    slug: "modern-web-development-foundations",
    title: "Modern Web Development Foundations",
    summary:
      "Semantic HTML, responsive CSS, TypeScript fundamentals, and accessible frontend engineering practices.",
    overview:
      "Focuses on durable web standards, mobile-first layout design, and clean TypeScript code before moving into full-stack application frameworks.",
    category: "Web Development",
    level: "Intermediate",
    modality: "Self-paced (planned)",
    availability: "Preview / Upcoming",
    isProvisional: true,
    intendedAudience: [
      "Learners transitioning from basic coding to structured web engineering",
      "University students building portfolio-ready web fundamentals",
    ],
    prerequisites: ["Familiarity with basic programming logic (variables, functions, loops)"],
    learningOutcomes: [
      "Build semantic, keyboard-accessible HTML structures",
      "Create responsive layouts without horizontal overflow across viewports",
      "Write strongly typed TypeScript modules and basic automated tests",
    ],
    plannedModules: [
      "Module 1: Semantic HTML & Accessibility",
      "Module 2: Responsive Layout Systems",
      "Module 3: TypeScript & Component Architecture",
    ],
  },
  {
    id: "prov-data-analytics-foundations",
    slug: "practical-data-analytics-foundations",
    title: "Practical Data Analytics Foundations",
    summary:
      "Data cleaning, SQL querying basics, structured metrics thinking, and clear visual communication.",
    overview:
      "Prepares learners to turn raw spreadsheets and relational tables into accurate, verifiable summaries without misleading charts.",
    category: "Data Analytics",
    level: "Beginner",
    modality: "Self-paced (planned)",
    availability: "Preview / Upcoming",
    isProvisional: true,
    intendedAudience: [
      "Business, operations, and university learners working with data",
      "Beginners preparing for entry-level analyst workflows",
    ],
    prerequisites: ["Basic spreadsheet familiarity"],
    learningOutcomes: [
      "Structure clean tabular datasets and spot common data quality issues",
      "Write foundational SQL SELECT, WHERE, GROUP BY, and JOIN queries",
      "Present findings clearly with appropriate chart selection",
    ],
    plannedModules: [
      "Module 1: Data Literacy & Cleaning",
      "Module 2: Relational Data & SQL Essentials",
      "Module 3: Reporting & Honest Visualization",
    ],
  },
];

export class ProvisionalCourseCatalogRepository implements CourseCatalogRepository {
  async listAll(): Promise<readonly PublicCourseDetail[]> {
    return PROVISIONAL_COURSES;
  }

  async findBySlug(slug: string): Promise<PublicCourseDetail | null> {
    return PROVISIONAL_COURSES.find((course) => course.slug === slug) ?? null;
  }
}

export const defaultCourseCatalogRepository: CourseCatalogRepository =
  new PrismaCourseCatalogRepository();
