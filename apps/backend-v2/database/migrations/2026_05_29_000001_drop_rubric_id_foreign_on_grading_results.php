<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('writing_grading_results', function (Blueprint $table) {
            $table->dropForeign(['rubric_id']);
        });

        Schema::table('speaking_grading_results', function (Blueprint $table) {
            $table->dropForeign(['rubric_id']);
        });
    }

    public function down(): void
    {
        Schema::table('writing_grading_results', function (Blueprint $table) {
            $table->foreign('rubric_id')->references('id')->on('grading_rubrics');
        });

        Schema::table('speaking_grading_results', function (Blueprint $table) {
            $table->foreign('rubric_id')->references('id')->on('grading_rubrics');
        });
    }
};
