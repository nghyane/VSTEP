CREATE TYPE "public"."mock_test_status" AS ENUM('in_progress', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'processing', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."streak_direction" AS ENUM('UP', 'DOWN', 'NEUTRAL');--> statement-breakpoint
CREATE TYPE "public"."question_level" AS ENUM('A2', 'B1', 'B2', 'C1');--> statement-breakpoint
CREATE TYPE "public"."question_skill" AS ENUM('listening', 'reading', 'writing', 'speaking');--> statement-breakpoint
CREATE TYPE "public"."grading_mode" AS ENUM('AUTO', 'HUMAN', 'HYBRID');--> statement-breakpoint
CREATE TYPE "public"."review_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."skill" AS ENUM('listening', 'reading', 'writing', 'speaking');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'queued', 'processing', 'analyzing', 'grading', 'review_required', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('learner', 'instructor', 'admin');--> statement-breakpoint
CREATE TABLE "mock_test_session_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"answer" jsonb NOT NULL,
	"is_correct" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_test_session_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"skill" "skill" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mock_test_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mock_test_id" uuid NOT NULL,
	"status" "mock_test_status" DEFAULT 'in_progress' NOT NULL,
	"listening_score" integer,
	"reading_score" integer,
	"writing_score" integer,
	"speaking_score" integer,
	"overall_exam_score" integer,
	"section_scores" jsonb,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "mock_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" "question_level" NOT NULL,
	"blueprint" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"aggregate_type" varchar(50),
	"aggregate_id" uuid,
	"message_type" varchar(50) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "outbox_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"locked_at" timestamp with time zone,
	"locked_by" varchar(64),
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processed_callbacks" (
	"event_id" varchar(100) PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"target_band" integer NOT NULL,
	"current_estimated_band" varchar(10),
	"deadline" timestamp with time zone,
	"daily_study_time_minutes" integer DEFAULT 30 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"skill" "skill" NOT NULL,
	"current_level" "question_level" NOT NULL,
	"target_level" "question_level",
	"scaffold_stage" integer DEFAULT 1 NOT NULL,
	"streak_count" integer DEFAULT 0 NOT NULL,
	"streak_direction" "streak_direction",
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_skill_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"skill" "skill" NOT NULL,
	"submission_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"scaffolding_type" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"content" jsonb NOT NULL,
	"answer_key" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill" "question_skill" NOT NULL,
	"level" "question_level" NOT NULL,
	"format" varchar(50) NOT NULL,
	"content" jsonb NOT NULL,
	"answer_key" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "submission_details" (
	"submission_id" uuid PRIMARY KEY NOT NULL,
	"answer" jsonb NOT NULL,
	"result" jsonb,
	"feedback" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_events" (
	"event_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"kind" varchar(50) NOT NULL,
	"event_at" timestamp with time zone DEFAULT now() NOT NULL,
	"data" jsonb
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"skill" "skill" NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"score" integer,
	"band" integer,
	"confidence_score" integer,
	"review_required" boolean DEFAULT false,
	"is_late" boolean DEFAULT false,
	"attempt" integer DEFAULT 1 NOT NULL,
	"request_id" uuid,
	"review_priority" "review_priority",
	"reviewer_id" uuid,
	"grading_mode" "grading_mode",
	"audit_flag" boolean DEFAULT false NOT NULL,
	"claimed_by" uuid,
	"claimed_at" timestamp with time zone,
	"deadline_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"jti" varchar(36) NOT NULL,
	"replaced_by_jti" varchar(36),
	"revoked_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(255),
	"role" "user_role" DEFAULT 'learner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "mock_test_session_answers" ADD CONSTRAINT "mock_test_session_answers_session_id_mock_test_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."mock_test_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_test_session_answers" ADD CONSTRAINT "mock_test_session_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_test_session_submissions" ADD CONSTRAINT "mock_test_session_submissions_session_id_mock_test_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."mock_test_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_test_session_submissions" ADD CONSTRAINT "mock_test_session_submissions_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_test_sessions" ADD CONSTRAINT "mock_test_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_test_sessions" ADD CONSTRAINT "mock_test_sessions_mock_test_id_mock_tests_id_fk" FOREIGN KEY ("mock_test_id") REFERENCES "public"."mock_tests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_tests" ADD CONSTRAINT "mock_tests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbox" ADD CONSTRAINT "outbox_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processed_callbacks" ADD CONSTRAINT "processed_callbacks_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_goals" ADD CONSTRAINT "user_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_scores" ADD CONSTRAINT "user_skill_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_scores" ADD CONSTRAINT "user_skill_scores_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_details" ADD CONSTRAINT "submission_details_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_events" ADD CONSTRAINT "submission_events_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_claimed_by_users_id_fk" FOREIGN KEY ("claimed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mock_test_session_answers_session_idx" ON "mock_test_session_answers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "mock_test_session_submissions_session_idx" ON "mock_test_session_submissions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "mock_test_session_submissions_submission_idx" ON "mock_test_session_submissions" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "mock_test_sessions_user_idx" ON "mock_test_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mock_test_sessions_status_idx" ON "mock_test_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mock_test_sessions_user_status_idx" ON "mock_test_sessions" USING btree ("user_id","status") WHERE "mock_test_sessions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "mock_tests_level_idx" ON "mock_tests" USING btree ("level");--> statement-breakpoint
CREATE INDEX "mock_tests_active_idx" ON "mock_tests" USING btree ("level") WHERE "mock_tests"."is_active" = true AND "mock_tests"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "outbox_pending_idx" ON "outbox" USING btree ("created_at") WHERE "outbox"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "outbox_processing_idx" ON "outbox" USING btree ("locked_at") WHERE "outbox"."status" = 'processing';--> statement-breakpoint
CREATE INDEX "processed_callbacks_request_idx" ON "processed_callbacks" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "user_goals_user_idx" ON "user_goals" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_progress_user_skill_idx" ON "user_progress" USING btree ("user_id","skill");--> statement-breakpoint
CREATE INDEX "user_skill_scores_user_skill_idx" ON "user_skill_scores" USING btree ("user_id","skill","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "question_versions_unique_idx" ON "question_versions" USING btree ("question_id","version");--> statement-breakpoint
CREATE INDEX "questions_skill_level_idx" ON "questions" USING btree ("skill","level");--> statement-breakpoint
CREATE INDEX "questions_active_idx" ON "questions" USING btree ("skill","level") WHERE "questions"."is_active" = true AND "questions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "questions_format_idx" ON "questions" USING btree ("format");--> statement-breakpoint
CREATE INDEX "submission_events_submission_idx" ON "submission_events" USING btree ("submission_id","event_at");--> statement-breakpoint
CREATE INDEX "submissions_user_id_idx" ON "submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "submissions_status_idx" ON "submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "submissions_user_status_idx" ON "submissions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "submissions_review_queue_idx" ON "submissions" USING btree ("status","confidence_score") WHERE "submissions"."status" = 'review_required' AND "submissions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "submissions_user_history_idx" ON "submissions" USING btree ("user_id","created_at") WHERE "submissions"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "submissions_request_id_idx" ON "submissions" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_hash_idx" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_active_idx" ON "refresh_tokens" USING btree ("user_id") WHERE "refresh_tokens"."revoked_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email") WHERE "users"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "users" USING btree ("id") WHERE "users"."deleted_at" IS NULL;