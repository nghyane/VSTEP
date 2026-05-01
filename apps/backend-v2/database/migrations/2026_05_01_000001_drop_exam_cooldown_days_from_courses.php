<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bỏ cooldown — đơn giản hoá cam kết kỷ luật xuống 1 mốc duy nhất:
 * deadline = enrolled_at + commitment_window_days. Thực tế học viên hoàn
 * thành 3 bài full-test trước ngày 5–7 sau enroll → không cần "ân hạn".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn('exam_cooldown_days');
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->smallInteger('exam_cooldown_days')->default(0);
        });
    }
};
