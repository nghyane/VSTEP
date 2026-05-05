<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE coin_transactions DROP CONSTRAINT IF EXISTS coin_transactions_type_valid');
        DB::statement("ALTER TABLE coin_transactions ADD CONSTRAINT coin_transactions_type_valid CHECK (type IN ('topup', 'onboarding_bonus', 'promo_redeem', 'admin_grant', 'streak_milestone', 'support_level_use', 'exam_custom', 'exam_full', 'course_purchase', 'teacher_booking'))");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE coin_transactions DROP CONSTRAINT IF EXISTS coin_transactions_type_valid');
        DB::statement("ALTER TABLE coin_transactions ADD CONSTRAINT coin_transactions_type_valid CHECK (type IN ('topup', 'onboarding_bonus', 'promo_redeem', 'admin_grant', 'streak_milestone', 'support_level_use', 'exam_custom', 'exam_full', 'course_purchase'))");
    }
};
