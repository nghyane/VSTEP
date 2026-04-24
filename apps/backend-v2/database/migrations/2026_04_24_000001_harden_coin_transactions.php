<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coin_transactions', function (Blueprint $table) {
            $table->index(['profile_id', 'id'], 'idx_coin_profile_id');
        });

        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE coin_transactions ADD CONSTRAINT coin_transactions_delta_non_zero CHECK (delta <> 0)');
        DB::statement('ALTER TABLE coin_transactions ADD CONSTRAINT coin_transactions_balance_after_non_negative CHECK (balance_after >= 0)');
        DB::statement("ALTER TABLE coin_transactions ADD CONSTRAINT coin_transactions_type_valid CHECK (type IN ('topup', 'onboarding_bonus', 'promo_redeem', 'admin_grant', 'support_level_use', 'exam_custom', 'exam_full', 'course_purchase'))");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE coin_transactions DROP CONSTRAINT IF EXISTS coin_transactions_type_valid');
            DB::statement('ALTER TABLE coin_transactions DROP CONSTRAINT IF EXISTS coin_transactions_balance_after_non_negative');
            DB::statement('ALTER TABLE coin_transactions DROP CONSTRAINT IF EXISTS coin_transactions_delta_non_zero');
        }

        Schema::table('coin_transactions', function (Blueprint $table) {
            $table->dropIndex('idx_coin_profile_id');
        });
    }
};
