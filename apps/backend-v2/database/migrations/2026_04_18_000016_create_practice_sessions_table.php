<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Practice sessions root — dùng chung cho mọi drill module
 * (vocab, grammar, listening, reading, writing, speaking_drill,
 * speaking_vstep_practice).
 *
 * module decides which attempt table to associate.
 * duration_seconds compute khi ended (practice drives study time).
 *
 * support_levels_used: array of {level, used_at, coins_spent} per session.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->string('module', 30);
            $table->string('content_ref_type', 40);
            $table->uuid('content_ref_id');
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->json('support_levels_used')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['profile_id', 'started_at']);
            $table->index(['content_ref_type', 'content_ref_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_sessions');
    }
};
