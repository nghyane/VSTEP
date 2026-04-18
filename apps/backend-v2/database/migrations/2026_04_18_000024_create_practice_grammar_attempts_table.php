<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_grammar_attempts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('grammar_point_id')
                ->constrained('grammar_points')
                ->cascadeOnDelete();
            $table->foreignUuid('exercise_id')
                ->constrained('grammar_exercises')
                ->cascadeOnDelete();
            $table->foreignUuid('session_id')
                ->nullable()
                ->constrained('practice_sessions')
                ->nullOnDelete();
            $table->json('answer');
            $table->boolean('is_correct');
            $table->timestamp('attempted_at');

            $table->index(['profile_id', 'grammar_point_id', 'attempted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_grammar_attempts');
    }
};
