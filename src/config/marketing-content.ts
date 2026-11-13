export interface OfferingPillar {
  title: string;
  description: string;
  topics: readonly string[];
  href: string;
  ctaLabel: string;
}

export interface LearningStep {
  step: string;
  title: string;
  description: string;
  status: "Available" | "Coming Soon";
}

export interface FeaturedPreviewItem {
  slug: string;
  kind: "Course" | "Certification Prep";
  title: string;
  summary: string;
  level: string;
  statusLabel: string;
  href: string;
}

export interface FaqPreviewItem {
  question: string;
  answer: string;
}

export const offeringPillars: readonly OfferingPillar[] = [
  {
    title: "Digital Skills Education",
    description:
      "Structured, practical learning paths designed to help beginners, students, and professionals build modern technical fluency.",
    topics: [
      "AI literacy & practical workflows",
      "Cloud computing fundamentals",
      "Linux & networking essentials",
      "Cybersecurity & web development",
    ],
    href: "/courses",
    ctaLabel: "Browse courses",
  },
  {
    title: "Professional Certification Exam Prep",
    description:
      "Independent, domain-aligned preparation tracks that organize study objectives, practice concepts, and readiness reviews.",
    topics: [
      "Domain-by-domain syllabus alignment",
      "Concept reinforcement & remediation",
      "Timed mock exam readiness (upcoming)",
      "Clear third-party issuer attribution",
    ],
    href: "/certifications",
    ctaLabel: "Explore certification tracks",
  },
] as const;

export const learningJourneySteps: readonly LearningStep[] = [
  {
    step: "01",
    title: "Discover",
    description:
      "Explore upcoming courses and independent certification preparation tracks by topic area and skill level.",
    status: "Available",
  },
  {
    step: "02",
    title: "Create Your Account",
    description:
      "Register and verify your email to establish your learner profile and access your account portal.",
    status: "Available",
  },
  {
    step: "03",
    title: "Learn & Practice",
    description:
      "Follow structured lessons, hands-on exercises, and topic-level checks inside the upcoming learning workspace.",
    status: "Coming Soon",
  },
  {
    step: "04",
    title: "Prepare & Assess",
    description:
      "Test your readiness with timed mock examinations and domain feedback before sitting external vendor exams.",
    status: "Coming Soon",
  },
] as const;

export const featuredPreviewItems: readonly FeaturedPreviewItem[] = [
  {
    slug: "ai-literacy-and-practical-workflows",
    kind: "Course",
    title: "AI Literacy & Practical Workflows",
    summary:
      "Foundational concepts for understanding modern AI systems, prompt discipline, and responsible workplace adoption.",
    level: "Beginner",
    statusLabel: "Preview / Upcoming",
    href: "/courses/ai-literacy-and-practical-workflows",
  },
  {
    slug: "cloud-computing-foundations",
    kind: "Course",
    title: "Cloud Computing Foundations",
    summary:
      "Core cloud architecture concepts covering compute, storage, networking, identity, and shared responsibility.",
    level: "Beginner",
    statusLabel: "Preview / Upcoming",
    href: "/courses/cloud-computing-foundations",
  },
  {
    slug: "aws-cloud-practitioner-prep",
    kind: "Certification Prep",
    title: "AWS Certified Cloud Practitioner Prep",
    summary:
      "Independent exam-preparation track mapped to cloud concepts, security, technology, and billing domains.",
    level: "Foundational",
    statusLabel: "Preview / Upcoming",
    href: "/certifications/aws-cloud-practitioner-prep",
  },
] as const;

export const homeReasons: readonly { title: string; description: string }[] = [
  {
    title: "Structured for Real Progression",
    description:
      "Clear prerequisites, learning outcomes, and level indicators help you choose where to start without guesswork.",
  },
  {
    title: "Transparent About Exam Boundaries",
    description:
      "Stack Varsity provides independent training and exam preparation—never misleading claims of official vendor endorsement.",
  },
  {
    title: "Built for Accessibility & Mobile",
    description:
      "Clean, low-clutter pages designed to read comfortably on mobile phones, tablets, and desktop screens.",
  },
] as const;

export const homeFaqPreview: readonly FaqPreviewItem[] = [
  {
    question: "Does Stack Varsity issue official AWS, Microsoft, or CompTIA certifications?",
    answer:
      "No. Stack Varsity provides independent training and exam-preparation resources. Official certifications are issued solely by their respective certification bodies after passing their official examinations.",
  },
  {
    question: "Can I register an account today?",
    answer:
      "Yes. You can create and verify an account now. Course lesson delivery, timed mock exams, and payment checkout are scheduled for upcoming platform releases.",
  },
  {
    question: "Are the listed courses and tracks currently open for paid enrollment?",
    answer:
      "Not yet. Courses and certification tracks shown on the public site are clearly labeled as preview offerings while the learning and assessment modules are finalized.",
  },
] as const;
