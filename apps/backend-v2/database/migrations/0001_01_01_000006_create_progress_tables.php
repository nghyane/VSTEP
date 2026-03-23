<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_progress', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('skill');
            $table->string('current_level')->default('A2');
            $table->string('target_level')->nullable();
            $table->integer('scaffold_level')->default(0);
            $table->integer('streak_count')->default(0);
            $table->string('streak_direction')->default('neutral'); // up, down, neutral
            $table->integer('attempt_count')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'skill']);
        });

        Schema::create('user_goals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('target_band');
            $table->string('current_estimated_band')->nullable();
            $table->date('deadline')->nullable();
            $table->integer('daily_study_time_minutes')->nullable();
            $table->timestamps();
        });

        Schema::create('user_placements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('source'); // self_assess, placement, skipped
            $table->string('confidence')->default('medium');
            $table->jsonb('levels');
            $table->string('estimated_band')->nullable();
            $table->boolean('needs_verification')->default(false);
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_placements');
        Schema::dropIfExists('user_goals');
        Schema::dropIfExists('user_progress');
    }
};
