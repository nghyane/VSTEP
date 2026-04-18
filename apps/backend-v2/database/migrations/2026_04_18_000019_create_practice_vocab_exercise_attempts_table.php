<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Attempt log cho vocab_exercises (MCQ, fill_blank, word_form).
 * Tách riêng SRS review (đó là per-word) vs exercise (per exercise).
 *
 * answer JSONB theo kind (vd {selected_index: 2} hoặc {text: 'happy'}).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_vocab_exercise_attempts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('exercise_id')->constrained('vocab_exercises')->cascadeOnDelete();
            $table->foreignUuid('session_id')
                ->nullable()
                ->constrained('practice_sessions')
                ->nullOnDelete();
            $table->json('answer');
            $table->boolean('is_correct');
            $table->timestamp('attempted_at');

            $table->index(['profile_id', 'exercise_id', 'attempted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_vocab_exercise_attempts');
    }
};
