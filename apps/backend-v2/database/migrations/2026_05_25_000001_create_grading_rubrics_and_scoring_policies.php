<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grading_rubrics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('skill', 20);
            $table->unsignedInteger('version');
            $table->string('name', 200);
            $table->text('source_reference');
            $table->jsonb('criteria');
            $table->string('scoring_formula', 50)->default('linear_mean_10');
            $table->boolean('is_active')->default(false);
            $table->date('effective_from');
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['skill', 'version']);
        });

        // Partial unique: only one active rubric per skill
        DB::statement('CREATE UNIQUE INDEX grading_rubrics_active_per_skill ON grading_rubrics (skill) WHERE is_active = true');

        Schema::create('scoring_policies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('rubric_id');
            $table->unsignedInteger('version');
            $table->string('name', 200);
            $table->jsonb('rules');
            $table->boolean('is_active')->default(false);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('rubric_id')->references('id')->on('grading_rubrics');
            $table->unique(['rubric_id', 'version']);
        });

        DB::statement('CREATE UNIQUE INDEX scoring_policies_active_per_rubric ON scoring_policies (rubric_id) WHERE is_active = true');

        Schema::table('writing_grading_results', function (Blueprint $table) {
            $table->uuid('rubric_id')->nullable()->after('job_id');
            $table->foreign('rubric_id')->references('id')->on('grading_rubrics');
        });

        Schema::table('speaking_grading_results', function (Blueprint $table) {
            $table->uuid('rubric_id')->nullable()->after('job_id');
            $table->foreign('rubric_id')->references('id')->on('grading_rubrics');
        });
    }

    public function down(): void
    {
        Schema::table('speaking_grading_results', function (Blueprint $table) {
            $table->dropForeign(['rubric_id']);
            $table->dropColumn('rubric_id');
        });
        Schema::table('writing_grading_results', function (Blueprint $table) {
            $table->dropForeign(['rubric_id']);
            $table->dropColumn('rubric_id');
        });
        Schema::dropIfExists('scoring_policies');
        Schema::dropIfExists('grading_rubrics');
    }
};
