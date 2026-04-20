<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Speaking submission — audio_url + transcript (filled sau STT ở Slice 8).
 * task_ref_type ∈ (practice_speaking_drill, practice_speaking_task).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_speaking_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('session_id')
                ->constrained('practice_sessions')
                ->cascadeOnDelete();
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->string('task_ref_type', 30);
            $table->uuid('task_ref_id');
            $table->string('audio_url', 500);
            $table->smallInteger('duration_seconds');
            $table->longText('transcript')->nullable();
            $table->timestamp('submitted_at');

            $table->index(['profile_id', 'submitted_at']);
            $table->index(['task_ref_type', 'task_ref_id']);
            $table->index('session_id');
        });

        Schema::create('practice_speaking_drill_attempts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignUuid('session_id')
                ->constrained('practice_sessions')
                ->cascadeOnDelete();
            $table->foreignUuid('sentence_id')
                ->constrained('practice_speaking_drill_sentences')
                ->restrictOnDelete();
            $table->string('mode', 20);
            $table->longText('user_text')->nullable();
            $table->smallInteger('accuracy_percent')->nullable();
            $table->timestamp('attempted_at');

            $table->index(['session_id', 'attempted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_speaking_drill_attempts');
        Schema::dropIfExists('practice_speaking_submissions');
    }
};
