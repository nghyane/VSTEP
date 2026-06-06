<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teacher_grading_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('attempt_id')->unique()->constrained('assessment_attempts')->cascadeOnDelete();
            $table->foreignUuid('profile_id')->constrained('profiles')->cascadeOnDelete();
            $table->string('status', 30);
            $table->foreignUuid('assigned_teacher_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('student_note')->nullable();
            $table->text('staff_note')->nullable();
            $table->unsignedSmallInteger('priority')->default(0);
            $table->timestamp('due_at')->nullable();
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'requested_at']);
            $table->index(['assigned_teacher_id', 'status']);
            $table->index(['profile_id', 'status']);
        });

        Schema::create('teacher_grading_results', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('request_id')->unique()->constrained('teacher_grading_requests')->cascadeOnDelete();
            $table->foreignUuid('attempt_id')->constrained('assessment_attempts')->cascadeOnDelete();
            $table->foreignUuid('teacher_id')->constrained('users')->restrictOnDelete();
            $table->foreignUuid('rubric_id')->constrained('assessment_rubrics')->restrictOnDelete();
            $table->jsonb('criterion_scores');
            $table->decimal('overall_band', 3, 1);
            $table->jsonb('feedback')->nullable();
            $table->jsonb('calculation_trace')->nullable();
            $table->jsonb('ai_result_snapshot')->nullable();
            $table->timestamp('submitted_at');
            $table->timestamps();

            $table->index(['teacher_id', 'submitted_at']);
            $table->index('attempt_id');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_grading_results');
        Schema::dropIfExists('teacher_grading_requests');
    }
};
