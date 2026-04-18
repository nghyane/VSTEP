<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grading_jobs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('submission_type', 40);
            $table->uuid('submission_id');
            $table->string('status', 20)->default('pending');
            $table->smallInteger('attempts')->default(0);
            $table->text('last_error')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index(['submission_type', 'submission_id']);
        });

        Schema::create('writing_grading_results', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('job_id')->constrained('grading_jobs')->restrictOnDelete();
            $table->string('submission_type', 40);
            $table->uuid('submission_id');
            $table->smallInteger('version')->default(1);
            $table->boolean('is_active')->default(true);
            $table->json('rubric_scores');
            $table->decimal('overall_band', 3, 1);
            $table->json('strengths');
            $table->json('improvements');
            $table->json('rewrites');
            $table->json('annotations');
            $table->json('paragraph_feedback')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['submission_type', 'submission_id', 'is_active']);
        });

        Schema::create('speaking_grading_results', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('job_id')->constrained('grading_jobs')->restrictOnDelete();
            $table->string('submission_type', 40);
            $table->uuid('submission_id');
            $table->smallInteger('version')->default(1);
            $table->boolean('is_active')->default(true);
            $table->json('rubric_scores');
            $table->decimal('overall_band', 3, 1);
            $table->json('strengths');
            $table->json('improvements');
            $table->json('pronunciation_report')->nullable();
            $table->longText('transcript')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['submission_type', 'submission_id', 'is_active']);
        });

        Schema::create('teacher_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('booking_id')->nullable();
            $table->foreignUuid('teacher_id')->constrained('users')->restrictOnDelete();
            $table->string('submission_type', 40)->nullable();
            $table->uuid('submission_id')->nullable();
            $table->json('content');
            $table->boolean('visible_to_student')->default(true);
            $table->timestamps();

            $table->index(['submission_type', 'submission_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_reviews');
        Schema::dropIfExists('speaking_grading_results');
        Schema::dropIfExists('writing_grading_results');
        Schema::dropIfExists('grading_jobs');
    }
};
