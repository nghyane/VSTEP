<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grading_jobs', function (Blueprint $table) {
            $table->jsonb('progress')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('grading_jobs', function (Blueprint $table) {
            $table->dropColumn('progress');
        });
    }
};
