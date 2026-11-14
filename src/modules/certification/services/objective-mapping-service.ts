import "server-only";
import { recordAuditEvent } from "@/modules/auth/audit";
import { requireTrackEditor } from "@/modules/certification/permissions/track-permissions";
import { createObjectiveMappingSchema } from "@/modules/certification/schemas/mapping-schemas";
import { CertificationServiceError } from "@/modules/certification/services/track-errors";
import { getDb } from "@/server/db";

export async function addObjectiveResourceMapping(trackId: string, rawInput: unknown) {
  const session = await requireTrackEditor(trackId);
  const parsed = createObjectiveMappingSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new CertificationServiceError(
      parsed.error.issues[0]?.message ?? "Invalid objective mapping input",
      400,
      "VALIDATION_ERROR"
    );
  }

  const input = parsed.data;
  const db = getDb();

  const track = await db.preparationTrack.findUnique({
    where: { id: trackId },
    select: { id: true, examVersionId: true },
  });
  if (!track) {
    throw new CertificationServiceError("Preparation track not found", 404, "NOT_FOUND");
  }

  const objective = await db.examObjective.findUnique({
    where: { id: input.objectiveId },
    select: { id: true, examVersionId: true },
  });
  if (!objective || objective.examVersionId !== track.examVersionId) {
    throw new CertificationServiceError(
      "Objective does not belong to this track's exam version",
      400,
      "OBJECTIVE_MISMATCH"
    );
  }

  let resolvedCourseId = input.courseId ?? null;

  if (input.lessonId) {
    const lesson = await db.lesson.findUnique({
      where: { id: input.lessonId },
      include: {
        module: {
          include: {
            course: {
              include: { assignments: { select: { userId: true } } },
            },
          },
        },
      },
    });
    if (!lesson || lesson.archivedAt !== null) {
      throw new CertificationServiceError("Mapped lesson not found or archived", 404, "NOT_FOUND");
    }
    const course = lesson.module.course;
    const isCoursePublished = course.status === "PUBLISHED" && course.archivedAt === null && lesson.isPublished;
    const isAssignedToCourse =
      session.user.role === "ADMIN" ||
      course.assignments.some((a) => a.userId === session.user.id);

    if (!isCoursePublished && !isAssignedToCourse) {
      throw new CertificationServiceError(
        "Cannot map another instructor's unpublished lesson",
        403,
        "UNPUBLISHED_CONTENT_FORBIDDEN"
      );
    }

    if (resolvedCourseId && resolvedCourseId !== course.id) {
      throw new CertificationServiceError(
        "lessonId does not belong to the specified courseId",
        400,
        "COURSE_LESSON_MISMATCH"
      );
    }
    resolvedCourseId = course.id;
  } else if (resolvedCourseId) {
    const course = await db.course.findUnique({
      where: { id: resolvedCourseId },
      include: { assignments: { select: { userId: true } } },
    });
    if (!course || course.archivedAt !== null) {
      throw new CertificationServiceError("Mapped course not found or archived", 404, "NOT_FOUND");
    }
    const isAssignedToCourse =
      session.user.role === "ADMIN" ||
      course.assignments.some((a) => a.userId === session.user.id);

    if (course.status !== "PUBLISHED" && !isAssignedToCourse) {
      throw new CertificationServiceError(
        "Cannot map another instructor's unpublished course",
        403,
        "UNPUBLISHED_CONTENT_FORBIDDEN"
      );
    }
  }

  const duplicate = await db.objectiveResourceMapping.findFirst({
    where: {
      trackId,
      objectiveId: input.objectiveId,
      courseId: resolvedCourseId,
      lessonId: input.lessonId ?? null,
    },
    select: { id: true },
  });

  if (duplicate) {
    throw new CertificationServiceError(
      "This resource is already mapped to the selected objective",
      409,
      "DUPLICATE_MAPPING"
    );
  }

  const mapping = await db.objectiveResourceMapping.create({
    data: {
      trackId,
      objectiveId: input.objectiveId,
      courseId: resolvedCourseId,
      lessonId: input.lessonId ?? null,
      isRequired: input.isRequired,
      position: input.position,
      notes: input.notes ?? null,
    },
  });

  await recordAuditEvent({
    actorId: session.user.id,
    eventType: "CERTIFICATION_MAPPING_CREATED",
    metadata: {
      trackId,
      objectiveId: input.objectiveId,
      courseId: resolvedCourseId,
      lessonId: input.lessonId ?? null,
    },
  });

  return mapping;
}

export async function removeObjectiveResourceMapping(trackId: string, mappingId: string) {
  const session = await requireTrackEditor(trackId);
  const db = getDb();

  const existing = await db.objectiveResourceMapping.findUnique({
    where: { id: mappingId },
    select: { id: true, trackId: true },
  });
  if (!existing || existing.trackId !== trackId) {
    throw new CertificationServiceError("Objective mapping not found", 404, "NOT_FOUND");
  }

  await db.objectiveResourceMapping.delete({ where: { id: mappingId } });

  await recordAuditEvent({
    actorId: session.user.id,
    eventType: "CERTIFICATION_MAPPING_REMOVED",
    metadata: { trackId, mappingId },
  });
}

export async function revalidateTrackMappings(trackId: string) {
  await requireTrackEditor(trackId);
  const db = getDb();

  const mappings = await db.objectiveResourceMapping.findMany({
    where: { trackId },
    include: {
      course: { select: { id: true, status: true, archivedAt: true } },
      lesson: {
        select: {
          id: true,
          isPublished: true,
          archivedAt: true,
          module: { select: { archivedAt: true, course: { select: { status: true, archivedAt: true } } } },
        },
      },
    },
  });

  let staleCount = 0;

  for (const mapping of mappings) {
    let staleReason: string | null = null;

    if (mapping.lessonId) {
      if (!mapping.lesson || mapping.lesson.archivedAt !== null) {
        staleReason = "Mapped lesson is missing or archived";
      } else if (!mapping.lesson.isPublished) {
        staleReason = "Mapped lesson is unpublished";
      } else if (
        mapping.lesson.module.archivedAt !== null ||
        mapping.lesson.module.course.archivedAt !== null ||
        mapping.lesson.module.course.status !== "PUBLISHED"
      ) {
        staleReason = "Parent course or module is unpublished or archived";
      }
    } else if (mapping.courseId) {
      if (!mapping.course || mapping.course.archivedAt !== null) {
        staleReason = "Mapped course is missing or archived";
      } else if (mapping.course.status !== "PUBLISHED") {
        staleReason = `Mapped course status is ${mapping.course.status}`;
      }
    } else {
      staleReason = "Mapping has no active course or lesson reference";
    }

    const isStale = staleReason !== null;
    if (isStale) staleCount += 1;

    if (mapping.isStale !== isStale || mapping.staleReason !== staleReason) {
      await db.objectiveResourceMapping.update({
        where: { id: mapping.id },
        data: { isStale, staleReason },
      });
    }
  }

  return {
    totalMappings: mappings.length,
    staleCount,
  };
}

export async function listLearnerSafeObjectiveMappings(trackId: string, userId: string) {
  const db = getDb();

  const [mappings, enrollments] = await Promise.all([
    db.objectiveResourceMapping.findMany({
      where: {
        trackId,
        isStale: false,
      },
      orderBy: { position: "asc" },
      include: {
        objective: {
          select: { id: true, objectiveKey: true, title: true, domainId: true },
        },
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            status: true,
            accessType: true,
            archivedAt: true,
          },
        },
        lesson: {
          select: {
            id: true,
            slug: true,
            title: true,
            isPublished: true,
            archivedAt: true,
            module: {
              select: {
                archivedAt: true,
                course: {
                  select: {
                    id: true,
                    slug: true,
                    title: true,
                    status: true,
                    accessType: true,
                    archivedAt: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    db.enrollment.findMany({
      where: { userId, status: { in: ["ACTIVE", "COMPLETED"] } },
      select: { courseId: true },
    }),
  ]);

  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));

  return mappings
    .filter((m) => {
      if (m.lesson) {
        return (
          m.lesson.isPublished &&
          m.lesson.archivedAt === null &&
          m.lesson.module.archivedAt === null &&
          m.lesson.module.course.status === "PUBLISHED" &&
          m.lesson.module.course.archivedAt === null
        );
      }
      if (m.course) {
        return m.course.status === "PUBLISHED" && m.course.archivedAt === null;
      }
      return false;
    })
    .map((m) => {
      const targetCourse = m.lesson ? m.lesson.module.course : m.course!;
      const isEnrolled = enrolledCourseIds.has(targetCourse.id);
      const isLockedPaid = targetCourse.accessType === "PAID" && !isEnrolled;

      return {
        id: m.id,
        objectiveId: m.objective.id,
        objectiveKey: m.objective.objectiveKey,
        objectiveTitle: m.objective.title,
        domainId: m.objective.domainId,
        isRequired: m.isRequired,
        notes: m.notes,
        courseId: targetCourse.id,
        courseSlug: targetCourse.slug,
        courseTitle: targetCourse.title,
        accessType: targetCourse.accessType,
        isEnrolled,
        isLockedPaid,
        lessonId: m.lesson?.id ?? null,
        lessonSlug: m.lesson?.slug ?? null,
        lessonTitle: m.lesson?.title ?? null,
      };
    });
}
