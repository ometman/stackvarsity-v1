import { certificationFilterSchema } from "@/modules/certification/schemas/certification-query";
import type {
  CertificationTrackDetail,
  CertificationTrackSummary,
} from "@/modules/certification/types/certification";

const STANDARD_DISCLAIMER =
  "Stack Varsity provides independent training and exam-preparation materials. We are not affiliated with, sponsored by, or endorsed by this certification issuer. Official examinations and credentials are administered solely by the respective certification body.";

const PROVISIONAL_TRACKS: readonly CertificationTrackDetail[] = [
  {
    id: "cert-aws-ccp",
    slug: "aws-cloud-practitioner-prep",
    title: "AWS Certified Cloud Practitioner Prep",
    targetCertification: "AWS Certified Cloud Practitioner (Foundational)",
    issuer: "Amazon Web Services (AWS)",
    level: "Foundational",
    summary:
      "Independent preparation track covering core cloud concepts, security and compliance, core services, and billing awareness.",
    overview:
      "Structured to help beginners and non-engineering professionals build exam readiness across foundational cloud domains before scheduling an official examination.",
    availability: "Preview / Upcoming",
    isProvisional: true,
    audience: [
      "Learners new to cloud computing seeking a structured study plan",
      "Technical, operations, or business learners validating foundational cloud literacy",
    ],
    prerequisites: [
      "General IT and web literacy",
      "Recommended: Cloud Computing Foundations course",
    ],
    preparationTopics: [
      "Cloud Concepts & Value Proposition",
      "Security, Identity & Shared Responsibility",
      "Core Cloud Technology & Service Categories",
      "Billing, Pricing Models & Support Concepts",
    ],
    learningPathway: [
      "Complete foundational cloud reading and concept checks",
      "Review domain-by-domain objective summaries",
      "Practice with timed mock assessments (upcoming in Phase 6)",
    ],
    relatedCourseSlug: "cloud-computing-foundations",
    disclaimer: STANDARD_DISCLAIMER,
  },
  {
    id: "cert-comptia-net",
    slug: "comptia-network-plus-prep",
    title: "CompTIA Network+ Exam Prep",
    targetCertification: "CompTIA Network+",
    issuer: "CompTIA",
    level: "Foundational",
    summary:
      "Independent preparation track focused on networking fundamentals, implementations, operations, security, and troubleshooting.",
    overview:
      "Organizes essential networking concepts—IP addressing, routing, switching, wireless, and diagnostics—into structured study domains.",
    availability: "Preview / Upcoming",
    isProvisional: true,
    audience: [
      "Aspiring network technicians and IT support specialists",
      "Learners building networking prerequisites for cloud or security roles",
    ],
    prerequisites: ["Basic operating system and hardware familiarity"],
    preparationTopics: [
      "Networking Fundamentals & OSI/TCP-IP Models",
      "Network Implementations & Addressing",
      "Network Operations & Monitoring",
      "Network Security & Troubleshooting Methodology",
    ],
    learningPathway: [
      "Build core protocol fluency in Computer Networking Fundamentals",
      "Drill subnetting, ports, and diagnostic workflows",
      "Validate readiness with timed practice exams (upcoming in Phase 6)",
    ],
    relatedCourseSlug: "computer-networking-fundamentals",
    disclaimer: STANDARD_DISCLAIMER,
  },
  {
    id: "cert-comptia-sec",
    slug: "comptia-security-plus-prep",
    title: "CompTIA Security+ Exam Prep",
    targetCertification: "CompTIA Security+",
    issuer: "CompTIA",
    level: "Associate",
    summary:
      "Independent preparation track covering security threats, architecture, operations, governance, and risk management.",
    overview:
      "Designed for learners moving from IT fundamentals into defensive security concepts and structured exam-objective review.",
    availability: "Preview / Upcoming",
    isProvisional: true,
    audience: [
      "IT support, networking, and systems learners entering cybersecurity",
      "Candidates organizing study across core security domains",
    ],
    prerequisites: [
      "Foundational networking and operating system knowledge",
      "Recommended: Cybersecurity Principles & Hygiene",
    ],
    preparationTopics: [
      "General Security Concepts & Controls",
      "Threats, Vulnerabilities & Mitigations",
      "Security Architecture & Operations",
      "Security Program Management & Oversight",
    ],
    learningPathway: [
      "Complete Cybersecurity Principles & Hygiene",
      "Review domain terminology, cryptography, and identity controls",
      "Assess exam pacing with timed mock sessions (upcoming in Phase 6)",
    ],
    relatedCourseSlug: "cybersecurity-principles-and-hygiene",
    disclaimer: STANDARD_DISCLAIMER,
  },
  {
    id: "cert-az-900",
    slug: "microsoft-azure-fundamentals-prep",
    title: "Microsoft Azure Fundamentals Prep",
    targetCertification: "Microsoft Certified: Azure Fundamentals",
    issuer: "Microsoft",
    level: "Foundational",
    summary:
      "Independent preparation track covering cloud concepts, core Azure architecture, identity, governance, and cost management.",
    overview:
      "Helps beginners map general cloud principles to core Azure service categories, governance tools, and compliance concepts.",
    availability: "Preview / Upcoming",
    isProvisional: true,
    audience: [
      "Beginners exploring Microsoft cloud fundamentals",
      "Professionals preparing for foundational cloud governance and architecture concepts",
    ],
    prerequisites: ["Basic familiarity with IT concepts"],
    preparationTopics: [
      "Cloud Concepts & Consumption Models",
      "Core Architecture & Services",
      "Identity, Access & Governance",
      "Cost Management & Service Level Agreements",
    ],
    learningPathway: [
      "Start with Cloud Computing Foundations",
      "Study service categories and governance boundaries",
      "Complete timed readiness checks (upcoming in Phase 6)",
    ],
    relatedCourseSlug: "cloud-computing-foundations",
    disclaimer: STANDARD_DISCLAIMER,
  },
];

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
  };
}

export async function listCertificationTracks(
  issuerFilter?: string
): Promise<CertificationTrackSummary[]> {
  const parsed = certificationFilterSchema.safeParse({ issuer: issuerFilter });
  const issuer = parsed.success ? parsed.data.issuer : "all";

  const filtered =
    issuer === "all"
      ? PROVISIONAL_TRACKS
      : PROVISIONAL_TRACKS.filter((track) => track.issuer === issuer);

  return filtered.map(toSummary);
}

export async function getCertificationTrackBySlug(
  slug: string
): Promise<CertificationTrackDetail | null> {
  if (!slug || typeof slug !== "string") {
    return null;
  }
  return PROVISIONAL_TRACKS.find((track) => track.slug === slug.trim()) ?? null;
}

export async function listCertificationSlugs(): Promise<string[]> {
  return PROVISIONAL_TRACKS.map((track) => track.slug);
}
