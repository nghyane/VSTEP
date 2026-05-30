<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assessment_rubrics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('skill', 30);
            $table->string('task_type', 80);
            $table->unsignedInteger('version');
            $table->string('title', 200);
            $table->jsonb('criteria');
            $table->jsonb('evidence_schema');
            $table->jsonb('scoring_policy');
            $table->boolean('is_active')->default(false);
            $table->timestamp('effective_from')->nullable();
            $table->timestamps();

            $table->unique(['task_type', 'version']);
            $table->index(['skill', 'task_type', 'is_active']);
        });

        Schema::create('assessment_attempts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('profile_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('rubric_id')->constrained('assessment_rubrics')->restrictOnDelete();
            $table->string('skill', 30);
            $table->string('task_type', 80);
            $table->string('source_type', 30);
            $table->uuid('source_id');
            $table->jsonb('prompt');
            $table->jsonb('response_payload');
            $table->timestamp('submitted_at');
            $table->timestamps();

            $table->index(['profile_id', 'skill', 'task_type']);
            $table->index(['source_type', 'source_id']);
        });

        Schema::create('assessment_jobs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('attempt_id')->unique()->constrained('assessment_attempts')->cascadeOnDelete();
            $table->string('status', 30);
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->jsonb('progress')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index('status');
        });

        Schema::create('assessment_evidence', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('attempt_id')->unique()->constrained('assessment_attempts')->cascadeOnDelete();
            $table->foreignUuid('rubric_id')->constrained('assessment_rubrics')->restrictOnDelete();
            $table->jsonb('signals');
            $table->jsonb('evidence');
            $table->jsonb('validation');
            $table->jsonb('extraction_trace')->nullable();
            $table->timestamps();
        });

        Schema::create('assessment_results', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('attempt_id')->unique()->constrained('assessment_attempts')->cascadeOnDelete();
            $table->foreignUuid('rubric_id')->constrained('assessment_rubrics')->restrictOnDelete();
            $table->jsonb('criterion_scores');
            $table->decimal('overall_band', 3, 1);
            $table->jsonb('caps_applied')->nullable();
            $table->jsonb('calculation_trace');
            $table->jsonb('insights')->nullable();
            $table->jsonb('feedback')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_results');
        Schema::dropIfExists('assessment_evidence');
        Schema::dropIfExists('assessment_jobs');
        Schema::dropIfExists('assessment_attempts');
        Schema::dropIfExists('assessment_rubrics');
    }
};
