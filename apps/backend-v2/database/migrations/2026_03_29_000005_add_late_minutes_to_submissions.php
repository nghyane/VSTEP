<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('class_assignment_submissions', function (Blueprint $table) {
            $table->integer('late_minutes')->nullable()->after('submitted_at');
        });
    }

    public function down(): void
    {
        Schema::table('class_assignment_submissions', function (Blueprint $table) {
            $table->dropColumn('late_minutes');
        });
    }
};
