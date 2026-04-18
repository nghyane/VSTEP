<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_version_listening_sections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('exam_version_id')->constrained('exam_versions')->cascadeOnDelete();
            $table->tinyInteger('part');
            $table->string('part_title', 100);
            $table->smallInteger('duration_minutes');
            $table->string('audio_url', 500)->nullable();
            $table->text('transcript')->nullable();
            $table->integer('display_order')->default(0);
        });

        Schema::create('exam_version_listening_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('section_id')
                ->constrained('exam_version_listening_sections')
                ->cascadeOnDelete();
            $table->integer('display_order');
            $table->text('stem');
            $table->json('options');
            $table->tinyInteger('correct_index');
        });

        Schema::create('exam_version_reading_passages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('exam_version_id')->constrained('exam_versions')->cascadeOnDelete();
            $table->tinyInteger('part');
            $table->string('title', 200);
            $table->smallInteger('duration_minutes');
            $table->longText('passage');
            $table->integer('display_order')->default(0);
        });

        Schema::create('exam_version_reading_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('passage_id')
                ->constrained('exam_version_reading_passages')
                ->cascadeOnDelete();
            $table->integer('display_order');
            $table->text('stem');
            $table->json('options');
            $table->tinyInteger('correct_index');
        });

        Schema::create('exam_version_writing_tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('exam_version_id')->constrained('exam_versions')->cascadeOnDelete();
            $table->tinyInteger('part');
            $table->string('task_type', 20);
            $table->smallInteger('duration_minutes');
            $table->text('prompt');
            $table->smallInteger('min_words');
            $table->json('instructions')->nullable();
            $table->integer('display_order')->default(0);
        });

        Schema::create('exam_version_speaking_parts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('exam_version_id')->constrained('exam_versions')->cascadeOnDelete();
            $table->tinyInteger('part');
            $table->string('type', 20);
            $table->smallInteger('duration_minutes');
            $table->smallInteger('speaking_seconds');
            $table->json('content');
            $table->integer('display_order')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_version_speaking_parts');
        Schema::dropIfExists('exam_version_writing_tasks');
        Schema::dropIfExists('exam_version_reading_items');
        Schema::dropIfExists('exam_version_reading_passages');
        Schema::dropIfExists('exam_version_listening_items');
        Schema::dropIfExists('exam_version_listening_sections');
    }
};
