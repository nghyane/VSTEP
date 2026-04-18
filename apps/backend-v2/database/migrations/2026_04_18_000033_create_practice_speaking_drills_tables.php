<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Drill-tier: dictation/shadowing với sentence list.
 * Separate from practice_speaking_tasks (VSTEP-format).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_speaking_drills', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug', 80)->unique();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->string('level', 2);
            $table->smallInteger('estimated_minutes');
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['is_published', 'level']);
        });

        Schema::create('practice_speaking_drill_sentences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('drill_id')
                ->constrained('practice_speaking_drills')
                ->cascadeOnDelete();
            $table->integer('display_order')->default(0);
            $table->text('text');
            $table->text('translation')->nullable();

            $table->index(['drill_id', 'display_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_speaking_drill_sentences');
        Schema::dropIfExists('practice_speaking_drills');
    }
};
