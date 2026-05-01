<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_speaking_conversation_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('scenario_id')
                ->constrained('practice_speaking_scenarios')->cascadeOnDelete();
            $table->string('status', 20);
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->smallInteger('user_turn_count')->default(0);
            $table->smallInteger('vocab_used_count')->default(0);
            $table->smallInteger('vocab_target_count')->default(0);
            $table->smallInteger('grammar_ok_count')->default(0);
            $table->timestamps();

            $table->index(['profile_id', 'started_at']);
        });

        Schema::create('practice_speaking_conversation_turns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('session_id')
                ->constrained('practice_speaking_conversation_sessions')->cascadeOnDelete();
            $table->smallInteger('turn_index');
            $table->string('role', 8);
            $table->text('text');
            $table->json('feedback')->nullable();
            $table->json('suggested_words')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['session_id', 'turn_index']);
            $table->index('session_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_speaking_conversation_turns');
        Schema::dropIfExists('practice_speaking_conversation_sessions');
    }
};
