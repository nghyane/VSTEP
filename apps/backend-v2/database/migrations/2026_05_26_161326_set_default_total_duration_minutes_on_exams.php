<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->smallInteger('total_duration_minutes')->default(0)->change();
        });
    }

    public function down(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->smallInteger('total_duration_minutes')->default(null)->change();
        });
    }
};
