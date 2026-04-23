<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Mở rộng profile_daily_activity để track mọi loại activity.
 * Các cột drill_session_count và drill_duration_seconds được giữ lại
 * làm backward-compat alias qua accessor ở model.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profile_daily_activity', function (Blueprint $table) {
            $table->unsignedInteger('mcq_count')->default(0)->after('drill_duration_seconds');
            $table->unsignedInteger('mcq_correct_count')->default(0)->after('mcq_count');
            $table->unsignedInteger('reading_exercise_count')->default(0)->after('mcq_correct_count');
            $table->unsignedInteger('listening_exercise_count')->default(0)->after('reading_exercise_count');
            $table->unsignedInteger('writing_submission_count')->default(0)->after('listening_exercise_count');
            $table->unsignedInteger('speaking_submission_count')->default(0)->after('writing_submission_count');
            $table->unsignedInteger('vocab_review_count')->default(0)->after('speaking_submission_count');
            $table->unsignedInteger('exam_session_count')->default(0)->after('vocab_review_count');
            $table->unsignedInteger('total_duration_seconds')->default(0)->after('exam_session_count');
            $table->unsignedInteger('coins_earned')->default(0)->after('total_duration_seconds');
            $table->unsignedInteger('coins_spent')->default(0)->after('coins_earned');
        });
    }

    public function down(): void
    {
        Schema::table('profile_daily_activity', function (Blueprint $table) {
            $table->dropColumn([
                'mcq_count',
                'mcq_correct_count',
                'reading_exercise_count',
                'listening_exercise_count',
                'writing_submission_count',
                'speaking_submission_count',
                'vocab_review_count',
                'exam_session_count',
                'total_duration_seconds',
                'coins_earned',
                'coins_spent',
            ]);
        });
    }
};
