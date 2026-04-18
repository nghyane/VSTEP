<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Polymorphic MCQ answer cho listening/reading drill.
 * question_type ∈ ('practice_listening_question','practice_reading_question').
 * App-layer validate FK; Postgres không hỗ trợ native polymorphic FK.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_mcq_answers', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignUuid('session_id')
                ->constrained('practice_sessions')
                ->cascadeOnDelete();
            $table->string('question_type', 40);
            $table->uuid('question_id');
            $table->tinyInteger('selected_index');
            $table->boolean('is_correct');
            $table->timestamp('answered_at');

            $table->unique(['session_id', 'question_type', 'question_id'], 'uq_mcq_session_question');
            $table->index(['question_type', 'question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_mcq_answers');
    }
};
