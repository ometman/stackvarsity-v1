-- CreateEnum
CREATE TYPE "CertificationLifecycleStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'RETIRED');

-- CreateEnum
CREATE TYPE "SourceVerificationStatus" AS ENUM ('VERIFIED', 'NEEDS_REVERIFICATION', 'UNVERIFIED');

-- CreateEnum
CREATE TYPE "TrackAccessType" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "TrackAssignmentRole" AS ENUM ('AUTHOR', 'REVIEWER');

-- CreateEnum
CREATE TYPE "TrackEnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "certification_providers" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "official_homepage_url" TEXT,
    "trademark_notice" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certification_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_versions" (
    "id" TEXT NOT NULL,
    "certification_id" TEXT NOT NULL,
    "exam_code" TEXT NOT NULL,
    "version_label" TEXT NOT NULL,
    "status" "CertificationLifecycleStatus" NOT NULL DEFAULT 'DRAFT',
    "effective_from" TIMESTAMP(3),
    "retired_at" TIMESTAMP(3),
    "source_url" TEXT,
    "verified_at" TIMESTAMP(3),
    "verification_status" "SourceVerificationStatus" NOT NULL DEFAULT 'NEEDS_REVERIFICATION',
    "source_notes" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_domains" (
    "id" TEXT NOT NULL,
    "exam_version_id" TEXT NOT NULL,
    "domain_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "weight_min_percent" INTEGER,
    "weight_max_percent" INTEGER,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_objectives" (
    "id" TEXT NOT NULL,
    "exam_version_id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "objective_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "source_reference" TEXT,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preparation_tracks" (
    "id" TEXT NOT NULL,
    "exam_version_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "access_type" "TrackAccessType" NOT NULL DEFAULT 'FREE',
    "status" "CertificationLifecycleStatus" NOT NULL DEFAULT 'DRAFT',
    "intended_audience" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "prerequisites" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "disclaimer" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "published_at" TIMESTAMP(3),
    "retired_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "last_reviewed_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preparation_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "track_assignments" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "TrackAssignmentRole" NOT NULL DEFAULT 'AUTHOR',
    "assigned_by_id" TEXT,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "track_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objective_resource_mappings" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "objective_id" TEXT NOT NULL,
    "course_id" TEXT,
    "lesson_id" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,
    "notes" TEXT,
    "is_stale" BOOLEAN NOT NULL DEFAULT false,
    "stale_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "objective_resource_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learner_preparation_enrollments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "status" "TrackEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learner_preparation_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "certification_providers_slug_key" ON "certification_providers"("slug");

-- CreateIndex
CREATE INDEX "certification_providers_is_active_idx" ON "certification_providers"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "certifications_slug_key" ON "certifications"("slug");

-- CreateIndex
CREATE INDEX "certifications_provider_id_idx" ON "certifications"("provider_id");

-- CreateIndex
CREATE INDEX "certifications_is_active_idx" ON "certifications"("is_active");

-- CreateIndex
CREATE INDEX "exam_versions_certification_id_status_idx" ON "exam_versions"("certification_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "exam_versions_certification_id_exam_code_version_label_key" ON "exam_versions"("certification_id", "exam_code", "version_label");

-- CreateIndex
CREATE INDEX "exam_domains_exam_version_id_position_idx" ON "exam_domains"("exam_version_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "exam_domains_exam_version_id_domain_key_key" ON "exam_domains"("exam_version_id", "domain_key");

-- CreateIndex
CREATE INDEX "exam_objectives_domain_id_position_idx" ON "exam_objectives"("domain_id", "position");

-- CreateIndex
CREATE INDEX "exam_objectives_parent_id_idx" ON "exam_objectives"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_objectives_exam_version_id_objective_key_key" ON "exam_objectives"("exam_version_id", "objective_key");

-- CreateIndex
CREATE UNIQUE INDEX "preparation_tracks_slug_key" ON "preparation_tracks"("slug");

-- CreateIndex
CREATE INDEX "preparation_tracks_status_archived_at_idx" ON "preparation_tracks"("status", "archived_at");

-- CreateIndex
CREATE INDEX "preparation_tracks_exam_version_id_idx" ON "preparation_tracks"("exam_version_id");

-- CreateIndex
CREATE INDEX "preparation_tracks_created_by_id_idx" ON "preparation_tracks"("created_by_id");

-- CreateIndex
CREATE INDEX "track_assignments_user_id_idx" ON "track_assignments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "track_assignments_track_id_user_id_role_key" ON "track_assignments"("track_id", "user_id", "role");

-- CreateIndex
CREATE INDEX "objective_resource_mappings_track_id_objective_id_position_idx" ON "objective_resource_mappings"("track_id", "objective_id", "position");

-- CreateIndex
CREATE INDEX "objective_resource_mappings_course_id_idx" ON "objective_resource_mappings"("course_id");

-- CreateIndex
CREATE INDEX "objective_resource_mappings_lesson_id_idx" ON "objective_resource_mappings"("lesson_id");

-- CreateIndex
CREATE INDEX "learner_preparation_enrollments_user_id_status_idx" ON "learner_preparation_enrollments"("user_id", "status");

-- CreateIndex
CREATE INDEX "learner_preparation_enrollments_track_id_idx" ON "learner_preparation_enrollments"("track_id");

-- CreateIndex
CREATE UNIQUE INDEX "learner_preparation_enrollments_user_id_track_id_key" ON "learner_preparation_enrollments"("user_id", "track_id");

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "certification_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_versions" ADD CONSTRAINT "exam_versions_certification_id_fkey" FOREIGN KEY ("certification_id") REFERENCES "certifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_domains" ADD CONSTRAINT "exam_domains_exam_version_id_fkey" FOREIGN KEY ("exam_version_id") REFERENCES "exam_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_objectives" ADD CONSTRAINT "exam_objectives_exam_version_id_fkey" FOREIGN KEY ("exam_version_id") REFERENCES "exam_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_objectives" ADD CONSTRAINT "exam_objectives_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "exam_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_objectives" ADD CONSTRAINT "exam_objectives_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "exam_objectives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparation_tracks" ADD CONSTRAINT "preparation_tracks_exam_version_id_fkey" FOREIGN KEY ("exam_version_id") REFERENCES "exam_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparation_tracks" ADD CONSTRAINT "preparation_tracks_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_assignments" ADD CONSTRAINT "track_assignments_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "preparation_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_assignments" ADD CONSTRAINT "track_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_assignments" ADD CONSTRAINT "track_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective_resource_mappings" ADD CONSTRAINT "objective_resource_mappings_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "preparation_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective_resource_mappings" ADD CONSTRAINT "objective_resource_mappings_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "exam_objectives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective_resource_mappings" ADD CONSTRAINT "objective_resource_mappings_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objective_resource_mappings" ADD CONSTRAINT "objective_resource_mappings_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_preparation_enrollments" ADD CONSTRAINT "learner_preparation_enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_preparation_enrollments" ADD CONSTRAINT "learner_preparation_enrollments_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "preparation_tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
