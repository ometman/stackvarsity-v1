import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStudyPlanSchema } from "@/modules/certification/schemas/study-plan-schemas";
import {
  computeTaskDueDate,
  formatDueDateInTimezone,
} from "@/modules/certification/services/study-plan-service";

const mockRequireRole = vi.fn();

const mockDb = {
  learnerPreparationEnrollment: { findUnique: vi.fn() },
  learnerStudyPlan: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  studyTask: { findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
  $transaction: vi.fn(),
};

vi.mock("@/modules/auth/rbac", () => ({
  requireRole: (...args: unknown[]) => mockRequireRole(...args),
}));

vi.mock("@/server/db", () => ({
  getDb: () => mockDb,
}));

describe("Phase 5 study plan scheduling and ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      user: { id: "student-1", role: "STUDENT", mfaEnabled: false },
      mfaVerifiedAt: null,
    });
    mockDb.$transaction.mockImplementation(async (cb: (tx: typeof mockDb) => Promise<unknown>) =>
      cb(mockDb)
    );
  });

  it("computes deterministic week due dates across DST boundaries", () => {
    const start = new Date("2026-03-01T00:00:00.000Z");
    const week2 = computeTaskDueDate(start, 2);
    expect(formatDueDateInTimezone(week2, "America/New_York")).toBe("2026-03-08");
    expect(formatDueDateInTimezone(week2, "Africa/Accra")).toBe("2026-03-08");
  });

  it("rejects invalid IANA timezones", () => {
    const parsed = createStudyPlanSchema.safeParse({
      startDate: "2026-11-15",
      timezone: "Mars/Olympus_Mons",
      weeklyHours: 5,
    });
    expect(parsed.success).toBe(false);
  });

  it("returns existing study plan idempotently without duplicating tasks", async () => {
    mockDb.learnerPreparationEnrollment.findUnique.mockResolvedValue({ id: "enr-1" });
    mockDb.learnerStudyPlan.findUnique.mockResolvedValue({
      id: "plan-1",
      tasks: [{ id: "task-1" }],
    });

    const { createOrGetLearnerStudyPlan } = await import(
      "@/modules/certification/services/study-plan-service"
    );

    const plan = await createOrGetLearnerStudyPlan("track-1", {
      startDate: "2026-11-15",
      timezone: "UTC",
      weeklyHours: 6,
    });

    expect(plan.id).toBe("plan-1");
    expect(mockDb.learnerStudyPlan.create).not.toHaveBeenCalled();
  });

  it("preserves COMPLETED tasks when rescheduling a study plan", async () => {
    mockDb.learnerStudyPlan.findUnique
      .mockResolvedValueOnce({
        id: "plan-1",
        template: { tasks: [{ id: "tt-1", weekNumber: 1 }, { id: "tt-2", weekNumber: 2 }] },
        tasks: [
          { id: "task-done", templateTaskId: "tt-1", status: "COMPLETED" },
          { id: "task-open", templateTaskId: "tt-2", status: "PENDING" },
        ],
      })
      .mockResolvedValueOnce({ id: "plan-1", tasks: [] });

    const { rescheduleLearnerStudyPlan } = await import(
      "@/modules/certification/services/study-plan-service"
    );

    await rescheduleLearnerStudyPlan("track-1", {
      newStartDate: "2026-12-01",
      timezone: "Africa/Accra",
    });

    expect(mockDb.studyTask.update).toHaveBeenCalledTimes(1);
    expect(mockDb.studyTask.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "task-open" } })
    );
  });

  it("blocks cross-user study task completion updates (IDOR)", async () => {
    mockDb.studyTask.findUnique.mockResolvedValue({
      id: "task-1",
      completedAt: null,
      studyPlan: { id: "plan-other", userId: "student-other", trackId: "track-1" },
    });

    const { toggleStudyTaskCompletion } = await import(
      "@/modules/certification/services/study-plan-service"
    );

    await expect(
      toggleStudyTaskCompletion("track-1", "task-1", { completed: true })
    ).rejects.toMatchObject({ code: "FORBIDDEN", statusCode: 403 });
  });
});
