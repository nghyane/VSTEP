<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (! DB::table('system_configs')->where('key', 'teacher_grading.request_cost_coins')->exists()) {
            DB::table('system_configs')->insert([
                'key' => 'teacher_grading.request_cost_coins',
                'value' => json_encode(1, JSON_THROW_ON_ERROR),
                'description' => 'Xu/lần yêu cầu giáo viên chấm thủ công Writing/Speaking.',
                'updated_at' => now(),
            ]);
        }

        DB::statement('ALTER TABLE coin_transactions DROP CONSTRAINT IF EXISTS coin_transactions_type_valid');
        DB::statement("ALTER TABLE coin_transactions ADD CONSTRAINT coin_transactions_type_valid CHECK (type IN ('topup', 'onboarding_bonus', 'course_bonus', 'promo_redeem', 'admin_grant', 'streak_milestone', 'refund', 'support_level_use', 'exam_custom', 'exam_full', 'course_purchase', 'teacher_booking', 'practice_feedback', 'teacher_grading'))");
    }

    public function down(): void
    {
        DB::table('system_configs')->where('key', 'teacher_grading.request_cost_coins')->delete();

        DB::statement('ALTER TABLE coin_transactions DROP CONSTRAINT IF EXISTS coin_transactions_type_valid');
        DB::statement("ALTER TABLE coin_transactions ADD CONSTRAINT coin_transactions_type_valid CHECK (type IN ('topup', 'onboarding_bonus', 'course_bonus', 'promo_redeem', 'admin_grant', 'streak_milestone', 'refund', 'support_level_use', 'exam_custom', 'exam_full', 'course_purchase', 'teacher_booking', 'practice_feedback'))");
    }
};
