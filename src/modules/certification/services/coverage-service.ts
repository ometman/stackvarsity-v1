import "server-only";
import { requireRole } from "@/modules/auth/rbac";
import { requireTrackEditor } from "@/modules/certification/permissions/track-permissions";
import { CertificationServiceError } from "@/modules/certification/services/track-errors";
import { getDb } from "@/server/db";

export interface DomainCoverageSummary {
  domainId: string;
  domainKey: string;
  title: string;
  mappedLessonCount: number;
  completedLessonCount: number;
  lessonCoveragePercent: number | null;
  practiceAnsweredCount: number;
  practiceCorrectCount: number;
  practiceAccuracyPercent: number | null;
}

export interface StudyRecommendation {
  objectiveId: string;
  objectiveKey: string;
  objectiveTitle: string;
  reason: string;
  actionHref: string;
}

export async function getLearnerTrackCoverage(trackId: string) {
  const session = await requireRole(["STUDENT", "ADMIN"]);
  const db = getDb();

  const track = await db.preparationTrack.findUnique({
    where: { id: trackId },
    include: {
      examVersion: {
        include: {
          domains: {
            orderBy: { position: "asc" },
            include: {
              objectives: { orderBy: { position: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!track || track.archivedAt !== null || track.status === "DRAFT" || track.status === "IN_REVIEW") {
    throw new CertificationServiceError("Preparation track not found", 404, "NOT_FOUND");
  }

  const [mappings, lessonProgress, studyTasks, practiceResponses] = await Promise.all([
    db.objectiveResourceMapping.findMany({
      where: { trackId, isStale: false },
      select: { objectiveId: true, lessonId: true, courseId: true },
    }),
    db.lessonProgress.findMany({
      where: { userId: session.user.id, completed: true },
      select: { lessonId: true },
    }),
    db.studyTask.findMany({
      where: { studyPlan: { userId: session.user.id, trackId } },
      select: { objectiveId: true, status: true },
    }),
    db.practiceResponse.findMany({
      where: { userId: session.user.id, question: { trackId } },
      select: {
        isCorrect: true,
        question: { select: { objectiveId: true } },
      },
    }),
  ]);

  const completedLessonIds = new Set(lessonProgress.map((lp) => lp.lessonId));

  const domainSummaries: DomainCoverageSummary[] = [];
  const recommendations: StudyRecommendation[] = [];

  for (const domain of track.examVersion.domains) {
    const objIds = new Set(domain.objectives.map((o) => o.id));
    const domainLessonIds = new Set(
      mappings
        .filter((m) => objIds.has(m.objectiveId) && m.lessonId !== null)
        .map((m) => m.lessonId as string)
    );

    const mappedLessonCount = domainLessonIds.size;
    let completedLessonCount = 0;
    for (const lid of domainLessonIds) {
      if (completedLessonIds.has(lid)) completedLessonCount += 1;
    }

    const domainResponses = practiceResponses.filter((r) =>
      objIds.has(r.question.objectiveId)
    );
    const practiceAnsweredCount = domainResponses.length;
    const practiceCorrectCount = domainResponses.filter((r) => r.isCorrect).length;

    domainSummaries.push({
      domainId: domain.id,
      domainKey: domain.domainKey,
      title: domain.title,
      mappedLessonCount,
      completedLessonCount,
      lessonCoveragePercent:
        mappedLessonCount > 0 ? Math.round((completedLessonCount / mappedLessonCount) * 100) : null,
      practiceAnsweredCount,
      practiceCorrectCount,
      practiceAccuracyPercent:
        practiceAnsweredCount > 0
          ? Math.round((practiceCorrectCount / practiceAnsweredCount) * 100)
          : null,
    });

    for (const obj of domain.objectives) {
      const objLessonIds = mappings
        .filter((m) => m.objectiveId === obj.id && m.lessonId !== null)
        .map((m) => m.lessonId as string);
      const hasIncompleteLesson = objLessonIds.some((lid) => !completedLessonIds.has(lid));

      const objResponses = practiceResponses.filter((r) => r.question.objectiveId === obj.id);
      const objAccuracy =
        objResponses.length > 0
          ? objResponses.filter((r) => r.isCorrect).length / objResponses.length
          : null;

      if (hasIncompleteLesson && recommendations.length < 5) {
        recommendations.push({
          objectiveId: obj.id,
          objectiveKey: obj.objectiveKey,
          objectiveTitle: obj.title,
          reason: "Mapped LMS lessons remaining",
          actionHref: `/student/certifications/${trackId}`,
        });
      } else if (objAccuracy !== null && objAccuracy < 0.7 && recommendations.length < 5) {
        recommendations.push({
          objectiveId: obj.id,
          objectiveKey: obj.objectiveKey,
          objectiveTitle: obj.title,
          reason: `Formative check accuracy ${Math.round(objAccuracy * 100)}% (${objResponses.length} answered)`,
          actionHref: `/student/certifications/${trackId}/practice`,
        });
      }
    }
  }

  const totalStudyTasks = studyTasks.length;
  const completedStudyTasks = studyTasks.filter((t) => t.status === "COMPLETED").length;

  return {
    track,
    domainSummaries,
    recommendations,
    studyPlanSummary: {
      totalTasks: totalStudyTasks,
      completedTasks: completedStudyTasks,
      completionPercent:
        totalStudyTasks > 0 ? Math.round((completedStudyTasks / totalStudyTasks) * 100) : null,
    },
    practiceSummary: {
      answeredCount: practiceResponses.length,
      correctCount: practiceResponses.filter((r) => r.isCorrect).length,
      accuracyPercent:
        practiceResponses.length > 0
          ? Math.round(
              (practiceResponses.filter((r) => r.isCorrect).length / practiceResponses.length) *
                100
            )
          : null,
    },
  };
}

export async function getTrackGovernanceSummary(trackId: string) {
  await requireTrackEditor(trackId);
  const db = getDb();

  const track = await db.preparationTrack.findUnique({
    where: { id: trackId },
    include: {
      examVersion: {
        include: {
          certification: { include: { provider: true } },
          objectives: { select: { id: true } },
        },
      },
      resourceMappings: {
        select: { id: true, objectiveId: true, isStale: true },
      },
      practiceQuestions: {
        select: { id: true, status: true },
      },
    },
  });

  if (!track) {
    throw new CertificationServiceError("Preparation track not found", 404, "NOT_FOUND");
  }

  const mappedObjectiveIds = new Set(track.resourceMappings.map((m) => m.objectiveId));
  const unmappedObjectiveCount = track.examVersion.objectives.filter(
    (o) => !mappedObjectiveIds.has(o.id)
  ).length;

  return {
    trackId: track.id,
    title: track.title,
    status: track.status,
    revision: track.revision,
    lastReviewedAt: track.lastReviewedAt,
    examVerificationStatus: track.examVersion.verificationStatus,
    examVersionStatus: track.examVersion.status,
    totalObjectives: track.examVersion.objectives.length,
    unmappedObjectiveCount,
    staleMappingCount: track.resourceMappings.filter((m) => m.isStale).length,
    questionCounts: {
      draft: track.practiceQuestions.filter((q) => q.status === "DRAFT").length,
      inReview: track.practiceQuestions.filter((q) => q.status === "IN_REVIEW").length,
      published: track.practiceQuestions.filter((q) => q.status === "PUBLISHED").length,
      retired: track.practiceQuestions.filter((q) => q.status === "RETIRED").length,
    },
  };
}
