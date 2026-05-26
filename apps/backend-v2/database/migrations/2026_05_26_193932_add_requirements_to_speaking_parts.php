<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_version_speaking_parts', function (Blueprint $table) {
            $table->jsonb('requirements')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('exam_version_speaking_parts', function (Blueprint $table) {
            $table->dropColumn('requirements');
        });
    }
};
