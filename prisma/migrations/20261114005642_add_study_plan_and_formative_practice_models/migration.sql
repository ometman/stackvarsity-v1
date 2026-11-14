-- CreateEnum
CREATE TYPE "StudyPlanStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "StudyTaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "QuestionOriginType" AS ENUM ('ORIGINAL_AUTHORED', 'LICENSED_PARTNER');

-- CreateTable
CREATE TABLE "study_plan_templates" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimated_weeks" INTEGER NOT NULL DEFAULT 4,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_plan_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_plan_template_tasks" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "objective_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "week_number" INTEGER NOT NULL,
    "estimated_minutes" INTEGER NOT NULL DEFAULT 30,
    "position" INTEGER NOT NULL,

    CONSTRAINT "study_plan_template_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learner_study_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "template_version" INTEGER NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "start_date" TIMESTAMP(3) NOT NULL,
    "weekly_hours" INTEGER NOT NULL DEFAULT 5,
    "status" "StudyPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learner_study_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_tasks" (
    "id" TEXT NOT NULL,
    "study_plan_id" TEXT NOT NULL,
    "template_task_id" TEXT,
    "objective_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3) NOT NULL,
    "estimated_minutes" INTEGER NOT NULL DEFAULT 30,
    "position" INTEGER NOT NULL,
    "status" "StudyTaskStatus" NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_questions" (
    "id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "objective_id" TEXT NOT NULL,
    "stem" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "source_reference" TEXT,
    "origin_type" "QuestionOriginType" NOT NULL DEFAULT 'ORIGINAL_AUTHORED',
    "license_note" TEXT NOT NULL,
    "status" "CertificationLifecycleStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by_id" TEXT NOT NULL,
    "reviewed_by_id" TEXT,
    "published_at" TIMESTAMP(3),
    "retired_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "practice_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_question_options" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,

    CONSTRAINT "practice_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_attempts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "track_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "practice_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_responses" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "question_version" INTEGER NOT NULL,
    "selected_option_id" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practice_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_plan_templates_track_id_is_active_idx" ON "study_plan_templates"("track_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "study_plan_templates_track_id_version_key" ON "study_plan_templates"("track_id", "version");

-- CreateIndex
CREATE INDEX "study_plan_template_tasks_template_id_week_number_position_idx" ON "study_plan_template_tasks"("template_id", "week_number", "position");

-- CreateIndex
CREATE INDEX "learner_study_plans_user_id_status_idx" ON "learner_study_plans"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "learner_study_plans_user_id_track_id_key" ON "learner_study_plans"("user_id", "track_id");

-- CreateIndex
CREATE INDEX "study_tasks_study_plan_id_due_date_position_idx" ON "study_tasks"("study_plan_id", "due_date", "position");

-- CreateIndex
CREATE INDEX "practice_questions_track_id_status_idx" ON "practice_questions"("track_id", "status");

-- CreateIndex
CREATE INDEX "practice_questions_objective_id_status_idx" ON "practice_questions"("objective_id", "status");

-- CreateIndex
CREATE INDEX "practice_question_options_question_id_position_idx" ON "practice_question_options"("question_id", "position");

-- CreateIndex
CREATE INDEX "practice_attempts_user_id_track_id_idx" ON "practice_attempts"("user_id", "track_id");

-- CreateIndex
CREATE INDEX "practice_responses_user_id_question_id_idx" ON "practice_responses"("user_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "practice_responses_user_id_idempotency_key_key" ON "practice_responses"("user_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "practice_responses_attempt_id_question_id_key" ON "practice_responses"("attempt_id", "question_id");

-- AddForeignKey
ALTER TABLE "study_plan_templates" ADD CONSTRAINT "study_plan_templates_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "preparation_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_template_tasks" ADD CONSTRAINT "study_plan_template_tasks_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "study_plan_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_plan_template_tasks" ADD CONSTRAINT "study_plan_template_tasks_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "exam_objectives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_study_plans" ADD CONSTRAINT "learner_study_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_study_plans" ADD CONSTRAINT "learner_study_plans_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "preparation_tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_study_plans" ADD CONSTRAINT "learner_study_plans_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "study_plan_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_tasks" ADD CONSTRAINT "study_tasks_study_plan_id_fkey" FOREIGN KEY ("study_plan_id") REFERENCES "learner_study_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_tasks" ADD CONSTRAINT "study_tasks_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "exam_objectives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_questions" ADD CONSTRAINT "practice_questions_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "preparation_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_questions" ADD CONSTRAINT "practice_questions_objective_id_fkey" FOREIGN KEY ("objective_id") REFERENCES "exam_objectives"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_questions" ADD CONSTRAINT "practice_questions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_questions" ADD CONSTRAINT "practice_questions_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_question_options" ADD CONSTRAINT "practice_question_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "practice_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_attempts" ADD CONSTRAINT "practice_attempts_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "preparation_tracks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_responses" ADD CONSTRAINT "practice_responses_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "practice_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_responses" ADD CONSTRAINT "practice_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_responses" ADD CONSTRAINT "practice_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "practice_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
