export interface SeedObjective {
  objectiveKey: string;
  title: string;
  summary: string;
  sourceReference: string;
  position: number;
}

export interface SeedDomain {
  domainKey: string;
  title: string;
  description: string;
  weightMinPercent?: number;
  weightMaxPercent?: number;
  position: number;
  objectives: SeedObjective[];
}

export interface SeedCertificationTrack {
  provider: {
    slug: string;
    name: string;
    officialHomepageUrl: string;
    trademarkNotice: string;
  };
  certification: {
    slug: string;
    name: string;
    level: string;
    summary: string;
  };
  examVersion: {
    examCode: string;
    versionLabel: string;
    sourceUrl: string;
    sourceNotes: string;
  };
  track: {
    slug: string;
    title: string;
    summary: string;
    overview: string;
    intendedAudience: string[];
    prerequisites: string[];
    disclaimer: string;
    relatedCourseSlug?: string;
  };
  domains: SeedDomain[];
}

const STANDARD_DISCLAIMER =
  "Stack Varsity provides independent training and exam-preparation materials. We are not affiliated with, sponsored by, or endorsed by this certification issuer. Official examinations and credentials are administered solely by the respective certification body.";

export const SEED_CERTIFICATION_TRACKS: readonly SeedCertificationTrack[] = [
  {
    provider: {
      slug: "aws",
      name: "Amazon Web Services (AWS)",
      officialHomepageUrl: "https://aws.amazon.com/certification/",
      trademarkNotice:
        "AWS and Amazon Web Services are trademarks of Amazon.com, Inc. or its affiliates.",
    },
    certification: {
      slug: "aws-certified-cloud-practitioner",
      name: "AWS Certified Cloud Practitioner",
      level: "Foundational",
      summary:
        "Foundational cloud literacy credential covering cloud concepts, security, core technology, and billing models.",
    },
    examVersion: {
      examCode: "CLF-C02",
      versionLabel: "CLF-C02 (Illustrative Outline)",
      sourceUrl: "https://aws.amazon.com/certification/certified-cloud-practitioner/",
      sourceNotes:
        "Outline summarized for independent educational preparation. Verify current official exam guide on the provider site before scheduling.",
    },
    track: {
      slug: "aws-cloud-practitioner-prep",
      title: "AWS Certified Cloud Practitioner Prep",
      summary:
        "Independent preparation track covering core cloud concepts, security and compliance, core services, and billing awareness.",
      overview:
        "Structured to help beginners and non-engineering professionals build foundational cloud literacy across core domains before scheduling an official examination.",
      intendedAudience: [
        "Learners new to cloud computing seeking a structured study plan",
        "Technical, operations, or business learners validating foundational cloud literacy",
      ],
      prerequisites: [
        "General IT and web literacy",
        "Recommended: Cloud Computing Foundations course",
      ],
      disclaimer: STANDARD_DISCLAIMER,
      relatedCourseSlug: "cloud-computing-foundations",
    },
    domains: [
      {
        domainKey: "D1",
        title: "Cloud Concepts",
        description: "Value proposition of cloud computing, economics, and architectural principles.",
        position: 1,
        objectives: [
          {
            objectiveKey: "1.1",
            title: "Define the benefits of the cloud computing model",
            summary: "Understand agility, elasticity, global reach, and pay-as-you-go economics.",
            sourceReference: "Provider blueprint Domain 1",
            position: 1,
          },
          {
            objectiveKey: "1.2",
            title: "Identify cloud design principles",
            summary: "Understand high availability, fault tolerance, and loose coupling concepts.",
            sourceReference: "Provider blueprint Domain 1",
            position: 2,
          },
        ],
      },
      {
        domainKey: "D2",
        title: "Security and Compliance",
        description: "Shared responsibility model, identity management, and governance concepts.",
        position: 2,
        objectives: [
          {
            objectiveKey: "2.1",
            title: "Explain the shared responsibility model",
            summary: "Distinguish provider security of the cloud from customer security in the cloud.",
            sourceReference: "Provider blueprint Domain 2",
            position: 1,
          },
          {
            objectiveKey: "2.2",
            title: "Understand identity, access, and least privilege",
            summary: "Apply MFA, role-based access, and root account protection principles.",
            sourceReference: "Provider blueprint Domain 2",
            position: 2,
          },
        ],
      },
      {
        domainKey: "D3",
        title: "Cloud Technology and Services",
        description: "Core compute, storage, database, and networking service categories.",
        position: 3,
        objectives: [
          {
            objectiveKey: "3.1",
            title: "Compare core compute and storage categories",
            summary: "Distinguish virtual machines, serverless functions, object storage, and block storage.",
            sourceReference: "Provider blueprint Domain 3",
            position: 1,
          },
        ],
      },
      {
        domainKey: "D4",
        title: "Billing, Pricing, and Support",
        description: "Pricing models, cost visibility tools, and support tier concepts.",
        position: 4,
        objectives: [
          {
            objectiveKey: "4.1",
            title: "Compare cloud pricing and billing models",
            summary: "Understand on-demand, commitment discounts, and cost monitoring concepts.",
            sourceReference: "Provider blueprint Domain 4",
            position: 1,
          },
        ],
      },
    ],
  },
  {
    provider: {
      slug: "comptia",
      name: "CompTIA",
      officialHomepageUrl: "https://www.comptia.org/certifications",
      trademarkNotice: "CompTIA, Network+, and Security+ are trademarks of CompTIA, Inc.",
    },
    certification: {
      slug: "comptia-network-plus",
      name: "CompTIA Network+",
      level: "Foundational",
      summary:
        "Vendor-neutral networking credential covering network fundamentals, implementations, operations, security, and troubleshooting.",
    },
    examVersion: {
      examCode: "N10-009",
      versionLabel: "N10-009 (Illustrative Outline)",
      sourceUrl: "https://www.comptia.org/certifications/network",
      sourceNotes:
        "Outline summarized for independent educational preparation. Verify current official exam objectives on the provider site.",
    },
    track: {
      slug: "comptia-network-plus-prep",
      title: "CompTIA Network+ Exam Prep",
      summary:
        "Independent preparation track focused on networking fundamentals, implementations, operations, security, and troubleshooting.",
      overview:
        "Organizes essential networking concepts—IP addressing, routing, switching, wireless, and diagnostics—into structured study domains.",
      intendedAudience: [
        "Aspiring network technicians and IT support specialists",
        "Learners building networking prerequisites for cloud or security roles",
      ],
      prerequisites: ["Basic operating system and hardware familiarity"],
      disclaimer: STANDARD_DISCLAIMER,
      relatedCourseSlug: "computer-networking-fundamentals",
    },
    domains: [
      {
        domainKey: "D1",
        title: "Networking Concepts",
        description: "OSI model, TCP/IP suite, ports, protocols, and IP addressing.",
        position: 1,
        objectives: [
          {
            objectiveKey: "1.1",
            title: "Compare OSI layers and encapsulation",
            summary: "Map protocols, frames, packets, and segments across the 7-layer OSI model.",
            sourceReference: "Provider blueprint Domain 1",
            position: 1,
          },
          {
            objectiveKey: "1.2",
            title: "Apply IPv4 subnetting and addressing",
            summary: "Calculate network addresses, subnet masks, and host ranges.",
            sourceReference: "Provider blueprint Domain 1",
            position: 2,
          },
        ],
      },
      {
        domainKey: "D2",
        title: "Network Implementation & Operations",
        description: "Switching, routing, wireless standards, and monitoring.",
        position: 2,
        objectives: [
          {
            objectiveKey: "2.1",
            title: "Explain switching, VLANs, and routing basics",
            summary: "Understand Layer 2 segmentation and Layer 3 path selection.",
            sourceReference: "Provider blueprint Domain 2",
            position: 1,
          },
        ],
      },
      {
        domainKey: "D3",
        title: "Network Security & Troubleshooting",
        description: "Hardening, common threats, and structured troubleshooting methodology.",
        position: 3,
        objectives: [
          {
            objectiveKey: "3.1",
            title: "Apply structured network troubleshooting steps",
            summary: "Use ping, traceroute, DNS lookups, and interface diagnostics systematically.",
            sourceReference: "Provider blueprint Domain 3",
            position: 1,
          },
        ],
      },
    ],
  },
  {
    provider: {
      slug: "comptia",
      name: "CompTIA",
      officialHomepageUrl: "https://www.comptia.org/certifications",
      trademarkNotice: "CompTIA, Network+, and Security+ are trademarks of CompTIA, Inc.",
    },
    certification: {
      slug: "comptia-security-plus",
      name: "CompTIA Security+",
      level: "Associate",
      summary:
        "Vendor-neutral cybersecurity credential covering security concepts, threats, architecture, operations, and governance.",
    },
    examVersion: {
      examCode: "SY0-701",
      versionLabel: "SY0-701 (Illustrative Outline)",
      sourceUrl: "https://www.comptia.org/certifications/security",
      sourceNotes:
        "Outline summarized for independent educational preparation. Verify current official exam objectives on the provider site.",
    },
    track: {
      slug: "comptia-security-plus-prep",
      title: "CompTIA Security+ Exam Prep",
      summary:
        "Independent preparation track covering security threats, architecture, operations, governance, and risk management.",
      overview:
        "Designed for learners moving from IT fundamentals into defensive security concepts and structured exam-objective review.",
      intendedAudience: [
        "IT support, networking, and systems learners entering cybersecurity",
        "Candidates organizing study across core security domains",
      ],
      prerequisites: [
        "Foundational networking and operating system knowledge",
        "Recommended: Cybersecurity Principles & Hygiene",
      ],
      disclaimer: STANDARD_DISCLAIMER,
      relatedCourseSlug: "cybersecurity-principles-and-hygiene",
    },
    domains: [
      {
        domainKey: "D1",
        title: "General Security Concepts",
        description: "CIA triad, security controls, cryptography, and zero-trust principles.",
        position: 1,
        objectives: [
          {
            objectiveKey: "1.1",
            title: "Apply the CIA triad and security control categories",
            summary: "Classify preventive, detective, and corrective controls across technical and administrative layers.",
            sourceReference: "Provider blueprint Domain 1",
            position: 1,
          },
        ],
      },
      {
        domainKey: "D2",
        title: "Threats, Vulnerabilities, and Mitigations",
        description: "Threat actors, attack vectors, and defensive hardening.",
        position: 2,
        objectives: [
          {
            objectiveKey: "2.1",
            title: "Identify common attack vectors and mitigations",
            summary: "Recognize phishing, credential stuffing, injection, and privilege escalation defenses.",
            sourceReference: "Provider blueprint Domain 2",
            position: 1,
          },
        ],
      },
    ],
  },
  {
    provider: {
      slug: "microsoft",
      name: "Microsoft",
      officialHomepageUrl: "https://learn.microsoft.com/en-us/credentials/",
      trademarkNotice: "Microsoft and Azure are trademarks of Microsoft Corporation.",
    },
    certification: {
      slug: "microsoft-azure-fundamentals",
      name: "Microsoft Certified: Azure Fundamentals",
      level: "Foundational",
      summary:
        "Foundational cloud credential covering cloud concepts, core Azure architecture, identity, governance, and cost management.",
    },
    examVersion: {
      examCode: "AZ-900",
      versionLabel: "AZ-900 (Illustrative Outline)",
      sourceUrl: "https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/",
      sourceNotes:
        "Outline summarized for independent educational preparation. Verify current official exam skills outline on Microsoft Learn.",
    },
    track: {
      slug: "microsoft-azure-fundamentals-prep",
      title: "Microsoft Azure Fundamentals Prep",
      summary:
        "Independent preparation track covering cloud concepts, core Azure architecture, identity, governance, and cost management.",
      overview:
        "Helps beginners map general cloud principles to core Azure service categories, governance tools, and compliance concepts.",
      intendedAudience: [
        "Beginners exploring Microsoft cloud fundamentals",
        "Professionals preparing for foundational cloud governance and architecture concepts",
      ],
      prerequisites: ["Basic familiarity with IT concepts"],
      disclaimer: STANDARD_DISCLAIMER,
      relatedCourseSlug: "cloud-computing-foundations",
    },
    domains: [
      {
        domainKey: "D1",
        title: "Cloud Concepts",
        description: "Cloud benefits, shared responsibility, and service models (IaaS, PaaS, SaaS).",
        position: 1,
        objectives: [
          {
            objectiveKey: "1.1",
            title: "Compare IaaS, PaaS, and SaaS responsibility boundaries",
            summary: "Identify which operational layers are managed by the customer vs cloud provider.",
            sourceReference: "Provider blueprint Domain 1",
            position: 1,
          },
        ],
      },
      {
        domainKey: "D2",
        title: "Architecture, Services, and Governance",
        description: "Core compute/storage services, identity, policies, and cost management.",
        position: 2,
        objectives: [
          {
            objectiveKey: "2.1",
            title: "Understand resource hierarchies and access governance",
            summary: "Organize subscriptions, resource groups, role-based access, and spending limits.",
            sourceReference: "Provider blueprint Domain 2",
            position: 1,
          },
        ],
      },
    ],
  },
];
