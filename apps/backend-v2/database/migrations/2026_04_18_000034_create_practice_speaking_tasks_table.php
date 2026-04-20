<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * VSTEP-format speaking practice (part 1/2/3). Khác drill — có AI grading.
 * content JSONB chứa shape per part:
 * - part 1 (social): topics[{name, questions[]}]
 * - part 2 (solution): situation, options[]
 * - part 3 (development): central_idea, suggestions[], follow_up_question
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_speaking_tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug', 80)->unique();
            $table->string('title', 200);
            $table->tinyInteger('part');
            $table->string('task_type', 20);
            $table->json('content');
            $table->smallInteger('estimated_minutes');
            $table->smallInteger('speaking_seconds');
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['is_published', 'part']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_speaking_tasks');
    }
};
