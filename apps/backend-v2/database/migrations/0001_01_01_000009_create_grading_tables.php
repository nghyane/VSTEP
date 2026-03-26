<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grading_rubrics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('skill');       // writing, speaking
            $table->string('level');       // B1, B2, C1
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['skill', 'level']);
        });

        Schema::create('grading_criteria', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('rubric_id')->constrained('grading_rubrics')->cascadeOnDelete();
            $table->string('key');              // task_fulfillment, grammar, etc
            $table->string('name');             // Hoàn thành yêu cầu
            $table->text('description');        // Chi tiết cho agent
            $table->float('weight')->default(1.0);
            $table->integer('sort_order')->default(0);
            $table->jsonb('band_descriptors');  // {"9-10": "...", "7-8": "...", ...}
            $table->timestamps();

            $table->unique(['rubric_id', 'key']);
        });

        Schema::create('knowledge_point_edges', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('parent_id')->constrained('knowledge_points')->cascadeOnDelete();
            $table->foreignUuid('child_id')->constrained('knowledge_points')->cascadeOnDelete();
            $table->string('relation');  // prerequisite, part_of, related

            $table->unique(['parent_id', 'child_id']);
        });

        Schema::table('knowledge_points', function (Blueprint $table) {
            $table->text('description')->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('knowledge_points', function (Blueprint $table) {
            $table->dropColumn('description');
        });
        Schema::dropIfExists('knowledge_point_edges');
        Schema::dropIfExists('grading_criteria');
        Schema::dropIfExists('grading_rubrics');
    }
};
