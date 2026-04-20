<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cache mastery per (profile, grammar_point).
 * computed_level ∈ (new, learning, practicing, mastered).
 * Source of truth: practice_grammar_attempts.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_grammar_mastery', function (Blueprint $table) {
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('grammar_point_id')
                ->constrained('grammar_points')
                ->cascadeOnDelete();
            $table->integer('attempts')->default(0);
            $table->integer('correct')->default(0);
            $table->timestamp('last_practiced_at')->nullable();
            $table->string('computed_level', 20)->default('new');
            $table->timestamp('updated_at')->useCurrent();

            $table->primary(['profile_id', 'grammar_point_id']);
            $table->index(['profile_id', 'computed_level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_grammar_mastery');
    }
};
