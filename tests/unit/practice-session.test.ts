import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireRole = vi.fn();
const mockRecordAuditEvent = vi.fn();

const mockDb = {
  trackAssignment: { findFirst: vi.fn() },
  learnerPreparationEnrollment: { findUnique: vi.fn() },
  practiceAttempt: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  practiceQuestion: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  practiceResponse: { findUnique: vi.fn(), create: vi.fn() },
};

vi.mock("@/modules/auth/rbac", () => ({
  requireRole: (...args: unknown[]) => mockRequireRole(...args),
}));

vi.mock("@/modules/auth/audit", () => ({
  recordAuditEvent: (...args: unknown[]) => mockRecordAuditEvent(...args),
}));

vi.mock("@/server/db", () => ({
  getDb: () => mockDb,
}));

describe("Phase 5 formative question authoring and practice session security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      user: { id: "student-1", role: "STUDENT", mfaEnabled: false },
      mfaVerifiedAt: null,
    });
  });

  it("never leaks isCorrect or explanation when serving practice questions", async () => {
    mockDb.learnerPreparationEnrollment.findUnique.mockResolvedValue({ id: "enr-1" });
    mockDb.practiceAttempt.findFirst.mockResolvedValue({
      id: "att-1",
      responses: [],
    });
    mockDb.practiceQuestion.findMany.mockResolvedValue([
      {
        id: "q-1",
        stem: "What is elasticity?",
        objective: { objectiveKey: "1.1", title: "Cloud Benefits" },
        options: [
          { id: "opt-1", label: "Elasticity" },
          { id: "opt-2", label: "Static" },
        ],
      },
    ]);

    const { startOrResumePracticeSession } = await import(
      "@/modules/certification/services/practice-session-service"
    );

    const sessionData = await startOrResumePracticeSession("track-1");
    expect(sessionData.questions).toHaveLength(1);
    const serialized = JSON.stringify(sessionData);
    expect(serialized).not.toContain("isCorrect");
    expect(serialized).not.toContain("explanation");
  });

  it("assesses answers server-side and returns explanation only after valid submission", async () => {
    mockDb.practiceAttempt.findUnique.mockResolvedValue({
      id: "att-1",
      userId: "student-1",
      trackId: "track-1",
    });
    mockDb.practiceResponse.findUnique.mockResolvedValue(null);
    mockDb.practiceQuestion.findUnique.mockResolvedValue({
      id: "q-1",
      trackId: "track-1",
      status: "PUBLISHED",
      version: 1,
      explanation: "Elasticity scales resources automatically.",
      sourceReference: "Study Guide",
      options: [
        { id: "opt-1", label: "Elasticity", isCorrect: true },
        { id: "opt-2", label: "Static", isCorrect: false },
      ],
    });
    mockDb.practiceResponse.create.mockResolvedValue({ id: "resp-1" });

    const { submitPracticeResponse } = await import(
      "@/modules/certification/services/practice-session-service"
    );

    const result = await submitPracticeResponse("track-1", {
      attemptId: "att-1",
      questionId: "q-1",
      selectedOptionId: "opt-1",
      idempotencyKey: "key-12345678",
    });

    expect(result.isCorrect).toBe(true);
    expect(result.explanation).toContain("Elasticity");
    expect(result.idempotentReplay).toBe(false);
  });

  it("blocks cross-user practice submission (IDOR)", async () => {
    mockDb.practiceAttempt.findUnique.mockResolvedValue({
      id: "att-other",
      userId: "student-other",
      trackId: "track-1",
    });

    const { submitPracticeResponse } = await import(
      "@/modules/certification/services/practice-session-service"
    );

    await expect(
      submitPracticeResponse("track-1", {
        attemptId: "att-other",
        questionId: "q-1",
        selectedOptionId: "opt-1",
        idempotencyKey: "key-12345678",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN", statusCode: 403 });
  });

  it("prevents an author from self-approving their own practice question", async () => {
    mockRequireRole.mockResolvedValue({
      user: { id: "inst-1", role: "INSTRUCTOR", mfaEnabled: false },
      mfaVerifiedAt: null,
    });
    mockDb.trackAssignment.findFirst.mockResolvedValue({ id: "assign-1" });
    mockDb.practiceQuestion.findUnique.mockResolvedValue({
      id: "q-1",
      trackId: "track-1",
      status: "IN_REVIEW",
      createdById: "inst-1",
      explanation: "Valid explanation here.",
      licenseNote: "Original item",
      options: [
        { id: "o1", isCorrect: true },
        { id: "o2", isCorrect: false },
      ],
    });

    const { transitionPracticeQuestionStatus } = await import(
      "@/modules/certification/services/question-authoring-service"
    );

    await expect(
      transitionPracticeQuestionStatus("track-1", "q-1", { targetStatus: "PUBLISHED" })
    ).rejects.toMatchObject({ code: "SEPARATION_OF_DUTIES", statusCode: 403 });
  });
});
