<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            // Xu trừ khi học viên book 1 slot 1-1 với giáo viên. Default 50 khớp const cũ
            // trong CourseService — không break các khóa hiện hữu khi migrate.
            $table->smallInteger('booking_coin_cost')->default(50)->after('max_slots_per_student');
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn('booking_coin_cost');
        });
    }
};
