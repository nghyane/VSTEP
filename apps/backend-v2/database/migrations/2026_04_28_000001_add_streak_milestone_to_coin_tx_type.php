<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Mở rộng whitelist `coin_transactions.type` cho `streak_milestone`.
 *
 * Dùng raw SQL vì Laravel Schema không expose CHECK constraint API
 * (theo precedent của 2026_04_24_000001_harden_coin_transactions).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE coin_transactions DROP CONSTRAINT IF EXISTS coin_transactions_type_valid');
        DB::statement("ALTER TABLE coin_transactions ADD CONSTRAINT coin_transactions_type_valid CHECK (type IN ('topup', 'onboarding_bonus', 'promo_redeem', 'admin_grant', 'streak_milestone', 'support_level_use', 'exam_custom', 'exam_full', 'course_purchase'))");
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE coin_transactions DROP CONSTRAINT IF EXISTS coin_transactions_type_valid');
        DB::statement("ALTER TABLE coin_transactions ADD CONSTRAINT coin_transactions_type_valid CHECK (type IN ('topup', 'onboarding_bonus', 'promo_redeem', 'admin_grant', 'support_level_use', 'exam_custom', 'exam_full', 'course_purchase'))");
    }
};
