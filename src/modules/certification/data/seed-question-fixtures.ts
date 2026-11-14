export interface SeedPracticeQuestion {
  trackSlug: string;
  objectiveKey: string;
  stem: string;
  explanation: string;
  sourceReference: string;
  licenseNote: string;
  options: Array<{ label: string; isCorrect: boolean }>;
}

const ILLUSTRATIVE_LICENSE_NOTE =
  "Original illustrative formative item authored for Stack Varsity; not a vendor exam question.";

export const SEED_PRACTICE_QUESTIONS: readonly SeedPracticeQuestion[] = [
  {
    trackSlug: "aws-cloud-practitioner-prep",
    objectiveKey: "1.1",
    stem: "Which advantage best describes the ability to scale compute capacity up or down automatically as demand changes?",
    explanation:
      "Elasticity allows cloud workloads to acquire resources when needed and release them when demand drops, avoiding over-provisioning.",
    sourceReference: "Stack Varsity Cloud Concepts Study Guide",
    licenseNote: ILLUSTRATIVE_LICENSE_NOTE,
    options: [
      { label: "Elasticity", isCorrect: true },
      { label: "Static capacity planning", isCorrect: false },
      { label: "On-premises depreciation", isCorrect: false },
      { label: "Manual hardware procurement", isCorrect: false },
    ],
  },
  {
    trackSlug: "aws-cloud-practitioner-prep",
    objectiveKey: "2.1",
    stem: "Under the cloud shared responsibility model, who is generally responsible for managing customer data classification and user access permissions?",
    explanation:
      "While the cloud provider secures the underlying physical infrastructure and hardware, the customer remains responsible for data classification, identity permissions, and guest configuration.",
    sourceReference: "Stack Varsity Shared Responsibility Notes",
    licenseNote: ILLUSTRATIVE_LICENSE_NOTE,
    options: [
      { label: "The customer", isCorrect: true },
      { label: "The physical data center landlord only", isCorrect: false },
      { label: "The internet service provider", isCorrect: false },
      { label: "No party is responsible", isCorrect: false },
    ],
  },
  {
    trackSlug: "comptia-network-plus-prep",
    objectiveKey: "1.1",
    stem: "At which OSI layer do standard Ethernet switches primarily forward frames using MAC addresses?",
    explanation:
      "Layer 2 (Data Link) switches inspect destination MAC addresses to forward frames within a local network segment.",
    sourceReference: "Stack Varsity Networking Fundamentals",
    licenseNote: ILLUSTRATIVE_LICENSE_NOTE,
    options: [
      { label: "Layer 2 — Data Link", isCorrect: true },
      { label: "Layer 4 — Transport", isCorrect: false },
      { label: "Layer 5 — Session", isCorrect: false },
      { label: "Layer 7 — Application", isCorrect: false },
    ],
  },
  {
    trackSlug: "comptia-security-plus-prep",
    objectiveKey: "1.1",
    stem: "Encrypting sensitive files at rest primarily supports which pillar of the CIA triad?",
    explanation:
      "Encryption protects confidentiality by ensuring unauthorized parties cannot read data even if storage media is accessed.",
    sourceReference: "Stack Varsity Cybersecurity Principles",
    licenseNote: ILLUSTRATIVE_LICENSE_NOTE,
    options: [
      { label: "Confidentiality", isCorrect: true },
      { label: "Physical cooling", isCorrect: false },
      { label: "Cable redundancy", isCorrect: false },
      { label: "DNS round-robin", isCorrect: false },
    ],
  },
  {
    trackSlug: "microsoft-azure-fundamentals-prep",
    objectiveKey: "1.1",
    stem: "In which cloud service model does the provider manage the underlying hardware, operating system, and runtime so the customer focuses primarily on application code and data?",
    explanation:
      "Platform as a Service (PaaS) abstracts OS patching and runtime management, leaving application code and data management to the customer.",
    sourceReference: "Stack Varsity Cloud Service Models",
    licenseNote: ILLUSTRATIVE_LICENSE_NOTE,
    options: [
      { label: "Platform as a Service (PaaS)", isCorrect: true },
      { label: "Bare-metal colocation", isCorrect: false },
      { label: "On-premises virtualization", isCorrect: false },
      { label: "Local desktop storage", isCorrect: false },
    ],
  },
];
