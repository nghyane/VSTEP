CREATE TYPE "public"."exam_skill" AS ENUM('listening', 'reading', 'writing', 'speaking', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."exam_type" AS ENUM('practice', 'placement', 'mock');--> statement-breakpoint
CREATE TYPE "public"."knowledge_point_category" AS ENUM('grammar', 'vocabulary', 'strategy', 'topic');--> statement-breakpoint
CREATE TYPE "public"."placement_confidence" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."placement_source" AS ENUM('self_assess', 'placement', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."placement_status" AS ENUM('completed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."question_level" AS ENUM('A2', 'B1', 'B2', 'C1');--> statement-breakpoint
CREATE TYPE "public"."skill" AS ENUM('listening', 'reading', 'writing', 'speaking');--> statement-breakpoint
CREATE TYPE "public"."vstep_band" AS ENUM('B1', 'B2', 'C1');--> statement-breakpoint
CREATE TYPE "public"."exam_status" AS ENUM('in_progress', 'submitted', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('grading_completed', 'feedback_received', 'class_invite', 'goal_achieved');--> statement-breakpoint
CREATE TYPE "public"."streak_direction" AS ENUM('up', 'down', 'neutral');--> statement-breakpoint
CREATE TYPE "public"."grading_mode" AS ENUM('auto', 'human', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."review_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'processing', 'completed', 'review_pending', 'failed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('learner', 'instructor', 'admin');--> statement-breakpoint
CREATE TABLE "class_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"instructor_id" uuid NOT NULL,
	"invite_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructor_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"from_user_id" uuid NOT NULL,
	"to_user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"skill" "skill",
	"submission_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"answer" jsonb NOT NULL,
	"is_correct" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"exam_id" uuid NOT NULL,
	"status" "exam_status" DEFAULT 'in_progress' NOT NULL,
	"listening_score" numeric(3, 1),
	"reading_score" numeric(3, 1),
	"writing_score" numeric(3, 1),
	"speaking_score" numeric(3, 1),
	"overall_score" numeric(3, 1),
	"overall_band" "vstep_band",
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"skill" "skill" NOT NULL,
	"part" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" "question_level" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"type" "exam_type" DEFAULT 'practice' NOT NULL,
	"skill" "exam_skill",
	"duration_minutes" integer,
	"blueprint" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"platform" varchar(10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "device_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "knowledge_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "knowledge_point_category" NOT NULL,
	"name" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_points_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"data" jsonb,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "question_knowledge_points" (
	"questionId" uuid NOT NULL,
	"knowledgePointId" uuid NOT NULL,
	CONSTRAINT "question_knowledge_points_questionId_knowledgePointId_pk" PRIMARY KEY("questionId","knowledgePointId")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill" "skill" NOT NULL,
	"level" "question_level" NOT NULL,
	"part" smallint NOT NULL,
	"content" jsonb NOT NULL,
	"answerKey" jsonb,
	"explanation" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdBy" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"jti" varchar(36) NOT NULL,
	"replaced_by_jti" varchar(36),
	"device_info" text,
	"revoked_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_details" (
	"submission_id" uuid PRIMARY KEY NOT NULL,
	"answer" jsonb NOT NULL,
	"result" jsonb,
	"feedback" varchar(10000),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"skill" "skill" NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"score" numeric(3, 1),
	"band" "vstep_band",
	"review_priority" "review_priority",
	"reviewer_id" uuid,
	"grading_mode" "grading_mode",
	"audit_flag" boolean DEFAULT false NOT NULL,
	"claimed_by" uuid,
	"claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"target_band" "vstep_band" NOT NULL,
	"current_estimated_band" "vstep_band",
	"deadline" timestamp with time zone,
	"daily_study_time_minutes" integer DEFAULT 30 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_knowledge_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"knowledge_point_id" uuid NOT NULL,
	"mastery_score" numeric(5, 2) DEFAULT 0 NOT NULL,
	"total_attempted" integer DEFAULT 0 NOT NULL,
	"total_correct" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_placements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid,
	"status" "placement_status" NOT NULL,
	"source" "placement_source" NOT NULL,
	"confidence" "placement_confidence" NOT NULL,
	"listening_level" "question_level" NOT NULL,
	"reading_level" "question_level" NOT NULL,
	"writing_level" "question_level" NOT NULL,
	"speaking_level" "question_level" NOT NULL,
	"writing_source" varchar(20) NOT NULL,
	"speaking_source" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_placements_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"skill" "skill" NOT NULL,
	"current_level" "question_level" NOT NULL,
	"target_level" "question_level",
	"scaffold_level" integer DEFAULT 1 NOT NULL,
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
	"submission_id" uuid,
	"session_id" uuid,
	"score" numeric(3, 1) NOT NULL,
	"scaffolding_type" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_vocabulary_progress" (
	"user_id" uuid NOT NULL,
	"word_id" uuid NOT NULL,
	"known" boolean DEFAULT false NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_vocabulary_progress_user_id_word_id_pk" PRIMARY KEY("user_id","word_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(255),
	"avatar_key" varchar(512),
	"role" "user_role" DEFAULT 'learner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vocabulary_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"icon_key" varchar(100),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vocabulary_topics_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "vocabulary_words" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"word" varchar(100) NOT NULL,
	"phonetic" varchar(100),
	"audio_url" varchar(500),
	"part_of_speech" varchar(20) NOT NULL,
	"definition" text NOT NULL,
	"explanation" text NOT NULL,
	"examples" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "class_members" ADD CONSTRAINT "class_members_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_members" ADD CONSTRAINT "class_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_instructor_id_users_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_feedback" ADD CONSTRAINT "instructor_feedback_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_feedback" ADD CONSTRAINT "instructor_feedback_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_feedback" ADD CONSTRAINT "instructor_feedback_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instructor_feedback" ADD CONSTRAINT "instructor_feedback_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_answers" ADD CONSTRAINT "exam_answers_session_id_exam_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."exam_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_answers" ADD CONSTRAINT "exam_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_exam_id_exams_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_submissions" ADD CONSTRAINT "exam_submissions_session_id_exam_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."exam_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_submissions" ADD CONSTRAINT "exam_submissions_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_tokens" ADD CONSTRAINT "device_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_knowledge_points" ADD CONSTRAINT "question_knowledge_points_questionId_questions_id_fk" FOREIGN KEY ("questionId") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_knowledge_points" ADD CONSTRAINT "question_kp_kp_id_fk" FOREIGN KEY ("knowledgePointId") REFERENCES "public"."knowledge_points"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_details" ADD CONSTRAINT "submission_details_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_claimed_by_users_id_fk" FOREIGN KEY ("claimed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_goals" ADD CONSTRAINT "user_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_knowledge_progress" ADD CONSTRAINT "user_knowledge_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_knowledge_progress" ADD CONSTRAINT "user_kp_progress_kp_id_fk" FOREIGN KEY ("knowledge_point_id") REFERENCES "public"."knowledge_points"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_placements" ADD CONSTRAINT "user_placements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_placements" ADD CONSTRAINT "user_placements_session_id_exam_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."exam_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_scores" ADD CONSTRAINT "user_skill_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_scores" ADD CONSTRAINT "user_skill_scores_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_scores" ADD CONSTRAINT "user_skill_scores_session_id_exam_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."exam_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_vocabulary_progress" ADD CONSTRAINT "user_vocabulary_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_vocabulary_progress" ADD CONSTRAINT "user_vocabulary_progress_word_id_vocabulary_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."vocabulary_words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocabulary_words" ADD CONSTRAINT "vocabulary_words_topic_id_vocabulary_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."vocabulary_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "class_members_class_user_idx" ON "class_members" USING btree ("class_id","user_id");--> statement-breakpoint
CREATE INDEX "class_members_user_idx" ON "class_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "classes_invite_code_idx" ON "classes" USING btree ("invite_code");--> statement-breakpoint
CREATE INDEX "classes_instructor_idx" ON "classes" USING btree ("instructor_id");--> statement-breakpoint
CREATE INDEX "feedback_class_to_idx" ON "instructor_feedback" USING btree ("class_id","to_user_id");--> statement-breakpoint
CREATE INDEX "feedback_from_idx" ON "instructor_feedback" USING btree ("from_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_answers_session_question_idx" ON "exam_answers" USING btree ("session_id","question_id");--> statement-breakpoint
CREATE INDEX "exam_sessions_user_idx" ON "exam_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "exam_sessions_exam_id_idx" ON "exam_sessions" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "exam_sessions_status_idx" ON "exam_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "exam_sessions_user_status_idx" ON "exam_sessions" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "exam_submissions_session_submission_unique" ON "exam_submissions" USING btree ("session_id","submission_id");--> statement-breakpoint
CREATE INDEX "exam_submissions_session_idx" ON "exam_submissions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "exam_submissions_submission_idx" ON "exam_submissions" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "exams_level_idx" ON "exams" USING btree ("level");--> statement-breakpoint
CREATE INDEX "exams_skill_idx" ON "exams" USING btree ("skill");--> statement-breakpoint
CREATE INDEX "exams_active_idx" ON "exams" USING btree ("level") WHERE "exams"."is_active" = true;--> statement-breakpoint
CREATE INDEX "device_tokens_user_idx" ON "device_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_unread_idx" ON "notifications" USING btree ("user_id") WHERE "notifications"."read_at" IS NULL;--> statement-breakpoint
CREATE INDEX "questions_skill_level_active_idx" ON "questions" USING btree ("skill","level","isActive");--> statement-breakpoint
CREATE INDEX "questions_skill_part_idx" ON "questions" USING btree ("skill","part");--> statement-breakpoint
CREATE INDEX "questions_created_by_idx" ON "questions" USING btree ("createdBy");--> statement-breakpoint
CREATE INDEX "refresh_tokens_hash_idx" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_tokens_jti_unique" ON "refresh_tokens" USING btree ("jti");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "refresh_tokens_active_idx" ON "refresh_tokens" USING btree ("user_id") WHERE "refresh_tokens"."revoked_at" IS NULL;--> statement-breakpoint
CREATE INDEX "submissions_user_id_idx" ON "submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "submissions_skill_idx" ON "submissions" USING btree ("skill");--> statement-breakpoint
CREATE INDEX "submissions_question_id_idx" ON "submissions" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "submissions_status_idx" ON "submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "submissions_user_status_idx" ON "submissions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "submissions_review_queue_idx" ON "submissions" USING btree ("status") WHERE "submissions"."status" = 'review_pending';--> statement-breakpoint
CREATE INDEX "submissions_user_history_idx" ON "submissions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_goals_user_idx" ON "user_goals" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_knowledge_progress_user_kp_idx" ON "user_knowledge_progress" USING btree ("user_id","knowledge_point_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_progress_user_skill_idx" ON "user_progress" USING btree ("user_id","skill");--> statement-breakpoint
CREATE INDEX "user_skill_scores_user_skill_idx" ON "user_skill_scores" USING btree ("user_id","skill","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "vocabulary_words_topic_idx" ON "vocabulary_words" USING btree ("topic_id");