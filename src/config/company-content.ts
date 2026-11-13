export interface FaqCategory {
  id: string;
  title: string;
  items: readonly {
    id: string;
    question: string;
    answer: string;
  }[];
}

export const aboutValues: readonly { title: string; description: string }[] = [
  {
    title: "Practical Digital Fluency",
    description:
      "We focus on foundational skills—AI literacy, cloud computing, Linux, networking, cybersecurity, web development, and data analytics—that transfer directly to real technical work.",
  },
  {
    title: "Honest Exam Preparation",
    description:
      "Our certification-preparation tracks are structured around official domain objectives while remaining clearly independent from third-party certification bodies.",
  },
  {
    title: "Accessible by Design",
    description:
      "We build mobile-first, low-bandwidth-friendly pages with clear typography and keyboard-accessible navigation for learners in Ghana and worldwide.",
  },
] as const;

export const howItWorksStages: readonly {
  phase: string;
  title: string;
  availability: "Live now" | "Coming soon";
  summary: string;
  details: readonly string[];
}[] = [
  {
    phase: "01",
    title: "Discover Courses & Tracks",
    availability: "Live now",
    summary:
      "Browse digital skills courses and certification-preparation directories without needing an account.",
    details: [
      "Filter preview courses by topic category and skill level",
      "Review prerequisites, intended audience, and planned module outlines",
      "Check third-party issuer attribution on certification-prep tracks",
    ],
  },
  {
    phase: "02",
    title: "Create & Verify Your Account",
    availability: "Live now",
    summary:
      "Register with your email address, verify your account, and sign in to your learner portal.",
    details: [
      "Secure password-based registration and email verification",
      "Password recovery and role-protected portal access",
      "Ready for upcoming enrollment and progress features",
    ],
  },
  {
    phase: "03",
    title: "Learn & Practice",
    availability: "Coming soon",
    summary: "Work through structured lessons, guided exercises, and topic-level knowledge checks.",
    details: [
      "Self-paced lesson delivery inside the learner workspace (Phase 4)",
      "Progress tracking across completed modules and topics",
      "Clear separation between preview outlines and live published courses",
    ],
  },
  {
    phase: "04",
    title: "Prepare & Assess Readiness",
    availability: "Coming soon",
    summary: "Evaluate your exam readiness using timed mock assessments and domain-level feedback.",
    details: [
      "Original and licensed practice questions (Phase 6)",
      "Server-timed mock examinations with post-submission explanations",
      "Domain readiness summaries to guide targeted review",
    ],
  },
] as const;

export const faqCategories: readonly FaqCategory[] = [
  {
    id: "platform",
    title: "Platform & Availability",
    items: [
      {
        id: "platform-status",
        question: "What is currently live on Stack Varsity?",
        answer:
          "The public website, course and certification-prep previews, and user account authentication (registration, email verification, sign-in, and password reset) are live. Interactive course lessons, mock exams, and online payments are scheduled for upcoming releases.",
      },
      {
        id: "preview-labels",
        question: "Why are courses and tracks labeled Preview / Upcoming?",
        answer:
          "We label preview offerings transparently so visitors never mistake planned curriculum outlines for active paid enrollment. Enrollment and checkout will only appear once the learning and payment systems are released.",
      },
    ],
  },
  {
    id: "certifications",
    title: "Certification Preparation",
    items: [
      {
        id: "official-issuer",
        question: "Does Stack Varsity issue official vendor certifications?",
        answer:
          "No. Stack Varsity provides independent training and exam preparation. Official certifications are issued solely by third-party certification bodies such as AWS, CompTIA, or Microsoft after you pass their official examinations.",
      },
      {
        id: "exam-questions",
        question: "Are practice questions leaked from live vendor exams?",
        answer:
          "Never. Stack Varsity is committed to original and properly licensed study materials aligned to published exam domains—never unauthorized exam dumps.",
      },
    ],
  },
  {
    id: "accounts",
    title: "Accounts & Support",
    items: [
      {
        id: "account-registration",
        question: "Is creating a Stack Varsity account free?",
        answer:
          "Yes. Creating and verifying an account on the platform is free. Paid course or exam-prep offerings will be clearly priced before checkout is introduced in a future phase.",
      },
      {
        id: "contact-support",
        question: "How can I contact the Stack Varsity team?",
        answer:
          "You can reach us at hello@mystackvarsity.com or via the Contact page for general inquiries and partnership questions.",
      },
    ],
  },
] as const;
