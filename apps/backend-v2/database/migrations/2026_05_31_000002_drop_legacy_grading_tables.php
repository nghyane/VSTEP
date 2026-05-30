<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('speaking_grading_results');
        Schema::dropIfExists('writing_grading_results');
        Schema::dropIfExists('grading_jobs');
    }

    public function down(): void
    {
        // Legacy grading tables were replaced by assessment_* tables.
    }
};
