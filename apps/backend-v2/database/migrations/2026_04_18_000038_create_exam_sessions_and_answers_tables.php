<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * mode ∈ (custom, full). is_full_test = mode='full' AND 4 skills.
 * status ∈ (active, submitted, grading, graded, auto_submitted, abandoned).
 * server_deadline_at = ground truth timer.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('exam_version_id')->constrained('exam_versions')->restrictOnDelete();
            $table->string('mode', 20);
            $table->json('selected_skills');
            $table->boolean('is_full_test')->default(false);
            $table->decimal('time_extension_factor', 3, 2)->default(1.00);
            $table->timestamp('started_at');
            $table->timestamp('server_deadline_at');
            $table->timestamp('submitted_at')->nullable();
            $table->string('status', 20)->default('active');
            $table->integer('coins_charged');
            $table->timestamps();

            $table->index(['profile_id', 'submitted_at']);
            $table->index(['status', 'server_deadline_at']);
            $table->index(['profile_id', 'is_full_test', 'status']);
        });

        Schema::create('exam_mcq_answers', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignUuid('session_id')->constrained('exam_sessions')->cascadeOnDelete();
            $table->string('item_ref_type', 30);
            $table->uuid('item_ref_id');
            $table->tinyInteger('selected_index');
            $table->boolean('is_correct');
            $table->timestamp('answered_at');

            $table->unique(['session_id', 'item_ref_type', 'item_ref_id'], 'uq_exam_mcq_answer');
        });

        Schema::create('exam_writing_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('session_id')->constrained('exam_sessions')->cascadeOnDelete();
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('task_id')->constrained('exam_version_writing_tasks')->restrictOnDelete();
            $table->longText('text');
            $table->integer('word_count');
            $table->timestamp('submitted_at');

            $table->index('session_id');
        });

        Schema::create('exam_speaking_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('session_id')->constrained('exam_sessions')->cascadeOnDelete();
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('part_id')->constrained('exam_version_speaking_parts')->restrictOnDelete();
            $table->string('audio_url', 500);
            $table->smallInteger('duration_seconds');
            $table->longText('transcript')->nullable();
            $table->timestamp('submitted_at');

            $table->index('session_id');
        });

        Schema::create('exam_listening_play_log', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignUuid('session_id')->constrained('exam_sessions')->cascadeOnDelete();
            $table->foreignUuid('section_id')
                ->constrained('exam_version_listening_sections')
                ->restrictOnDelete();
            $table->timestamp('played_at');
            $table->string('client_ip', 45)->nullable();

            $table->unique(['session_id', 'section_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_listening_play_log');
        Schema::dropIfExists('exam_speaking_submissions');
        Schema::dropIfExists('exam_writing_submissions');
        Schema::dropIfExists('exam_mcq_answers');
        Schema::dropIfExists('exam_sessions');
    }
};
