<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * part 1 = letter, part 2 = essay. sample_answer rendered ở drill tier.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('practice_writing_prompts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('slug', 80)->unique();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->tinyInteger('part');
            $table->text('prompt');
            $table->smallInteger('min_words');
            $table->smallInteger('max_words');
            $table->json('required_points')->nullable();
            $table->json('keywords')->nullable();
            $table->json('sentence_starters')->nullable();
            $table->text('sample_answer')->nullable();
            $table->smallInteger('estimated_minutes');
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index(['is_published', 'part']);
        });

        Schema::create('practice_writing_outline_sections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('prompt_id')
                ->constrained('practice_writing_prompts')
                ->cascadeOnDelete();
            $table->string('title', 100);
            $table->text('description')->nullable();
            $table->integer('display_order')->default(0);
        });

        Schema::create('practice_writing_template_sections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('prompt_id')
                ->constrained('practice_writing_prompts')
                ->cascadeOnDelete();
            $table->string('title', 100);
            $table->text('content');
            $table->integer('display_order')->default(0);
        });

        Schema::create('practice_writing_sample_markers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('prompt_id')
                ->constrained('practice_writing_prompts')
                ->cascadeOnDelete();
            $table->text('match');
            $table->smallInteger('occurrence')->default(1);
            $table->string('side', 10);
            $table->string('color', 20);
            $table->string('label', 100);
            $table->text('detail')->nullable();
            $table->integer('display_order')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('practice_writing_sample_markers');
        Schema::dropIfExists('practice_writing_template_sections');
        Schema::dropIfExists('practice_writing_outline_sections');
        Schema::dropIfExists('practice_writing_prompts');
    }
};
