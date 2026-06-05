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
        $this->addAccountScopeToCoinTransactions();
        $this->addAccountScopeToTopupOrders();
        $this->addAccountScopeToStreakClaims();
        $this->preservePromoRedemptionsWhenProfileIsDeleted();
    }

    public function down(): void
    {
        $this->restorePromoRedemptionsProfileCascade();
        $this->removeAccountScopeFromStreakClaims();
        $this->removeAccountScopeFromTopupOrders();
        $this->removeAccountScopeFromCoinTransactions();
    }

    private function addAccountScopeToCoinTransactions(): void
    {
        Schema::table('coin_transactions', function (Blueprint $table): void {
            $table->foreignUuid('account_id')->nullable()->after('id')->constrained('users')->cascadeOnDelete();
            $table->index(['account_id', 'id'], 'idx_coin_account_id');
            $table->index(['account_id', 'created_at'], 'idx_coin_account_created_at');
        });

        DB::statement(<<<'SQL'
            UPDATE coin_transactions
            SET account_id = profiles.account_id
            FROM profiles
            WHERE coin_transactions.profile_id = profiles.id
        SQL);

        DB::statement(<<<'SQL'
            WITH ordered AS (
                SELECT id, SUM(delta) OVER (
                    PARTITION BY account_id
                    ORDER BY id
                    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                ) AS running_balance
                FROM coin_transactions
                WHERE account_id IS NOT NULL
            )
            UPDATE coin_transactions
            SET balance_after = ordered.running_balance
            FROM ordered
            WHERE coin_transactions.id = ordered.id
        SQL);

        DB::statement('ALTER TABLE coin_transactions ALTER COLUMN account_id SET NOT NULL');
        Schema::table('coin_transactions', function (Blueprint $table): void {
            $table->dropForeign(['profile_id']);
        });
        DB::statement('ALTER TABLE coin_transactions ALTER COLUMN profile_id DROP NOT NULL');
        Schema::table('coin_transactions', function (Blueprint $table): void {
            $table->foreign('profile_id')->references('id')->on('profiles')->nullOnDelete();
        });
    }

    private function addAccountScopeToTopupOrders(): void
    {
        Schema::table('wallet_topup_orders', function (Blueprint $table): void {
            $table->foreignUuid('account_id')->nullable()->after('profile_id')->constrained('users')->cascadeOnDelete();
            $table->index(['account_id', 'created_at'], 'idx_topup_account_created_at');
        });

        DB::statement(<<<'SQL'
            UPDATE wallet_topup_orders
            SET account_id = profiles.account_id
            FROM profiles
            WHERE wallet_topup_orders.profile_id = profiles.id
        SQL);

        DB::statement('ALTER TABLE wallet_topup_orders ALTER COLUMN account_id SET NOT NULL');
        Schema::table('wallet_topup_orders', function (Blueprint $table): void {
            $table->dropForeign(['profile_id']);
        });
        DB::statement('ALTER TABLE wallet_topup_orders ALTER COLUMN profile_id DROP NOT NULL');
        Schema::table('wallet_topup_orders', function (Blueprint $table): void {
            $table->foreign('profile_id')->references('id')->on('profiles')->nullOnDelete();
        });
    }

    private function addAccountScopeToStreakClaims(): void
    {
        Schema::table('profile_streak_claims', function (Blueprint $table): void {
            $table->foreignUuid('account_id')->nullable()->after('profile_id')->constrained('users')->cascadeOnDelete();
            $table->index('account_id', 'idx_streak_claim_account');
        });

        DB::statement(<<<'SQL'
            UPDATE profile_streak_claims
            SET account_id = profiles.account_id
            FROM profiles
            WHERE profile_streak_claims.profile_id = profiles.id
        SQL);

        DB::statement(<<<'SQL'
            WITH ranked AS (
                SELECT ctid, ROW_NUMBER() OVER (
                    PARTITION BY account_id, milestone_days
                    ORDER BY claimed_at, profile_id
                ) AS rn
                FROM profile_streak_claims
            )
            DELETE FROM profile_streak_claims
            WHERE ctid IN (SELECT ctid FROM ranked WHERE rn > 1)
        SQL);

        DB::statement('ALTER TABLE profile_streak_claims DROP CONSTRAINT IF EXISTS profile_streak_claims_pkey');
        DB::statement('ALTER TABLE profile_streak_claims ALTER COLUMN account_id SET NOT NULL');
        Schema::table('profile_streak_claims', function (Blueprint $table): void {
            $table->dropForeign(['profile_id']);
        });
        DB::statement('ALTER TABLE profile_streak_claims ALTER COLUMN profile_id DROP NOT NULL');
        Schema::table('profile_streak_claims', function (Blueprint $table): void {
            $table->foreign('profile_id')->references('id')->on('profiles')->nullOnDelete();
            $table->primary(['account_id', 'milestone_days'], 'profile_streak_claims_pkey');
        });
    }

    private function preservePromoRedemptionsWhenProfileIsDeleted(): void
    {
        Schema::table('promo_code_redemptions', function (Blueprint $table): void {
            $table->dropForeign(['profile_id']);
        });
        DB::statement('ALTER TABLE promo_code_redemptions ALTER COLUMN profile_id DROP NOT NULL');
        Schema::table('promo_code_redemptions', function (Blueprint $table): void {
            $table->foreign('profile_id')->references('id')->on('profiles')->nullOnDelete();
        });
    }

    private function restorePromoRedemptionsProfileCascade(): void
    {
        DB::statement('DELETE FROM promo_code_redemptions WHERE profile_id IS NULL');
        Schema::table('promo_code_redemptions', function (Blueprint $table): void {
            $table->dropForeign(['profile_id']);
        });
        DB::statement('ALTER TABLE promo_code_redemptions ALTER COLUMN profile_id SET NOT NULL');
        Schema::table('promo_code_redemptions', function (Blueprint $table): void {
            $table->foreign('profile_id')->references('id')->on('profiles')->cascadeOnDelete();
        });
    }

    private function removeAccountScopeFromStreakClaims(): void
    {
        DB::statement('DELETE FROM profile_streak_claims WHERE profile_id IS NULL');
        DB::statement('ALTER TABLE profile_streak_claims DROP CONSTRAINT IF EXISTS profile_streak_claims_pkey');
        Schema::table('profile_streak_claims', function (Blueprint $table): void {
            $table->dropForeign(['profile_id']);
            $table->dropForeign(['account_id']);
        });
        DB::statement('ALTER TABLE profile_streak_claims ALTER COLUMN profile_id SET NOT NULL');
        Schema::table('profile_streak_claims', function (Blueprint $table): void {
            $table->foreign('profile_id')->references('id')->on('profiles')->cascadeOnDelete();
            $table->primary(['profile_id', 'milestone_days'], 'profile_streak_claims_pkey');
            $table->dropColumn('account_id');
        });
    }

    private function removeAccountScopeFromTopupOrders(): void
    {
        DB::statement('DELETE FROM wallet_topup_orders WHERE profile_id IS NULL');
        Schema::table('wallet_topup_orders', function (Blueprint $table): void {
            $table->dropForeign(['profile_id']);
            $table->dropForeign(['account_id']);
        });
        DB::statement('ALTER TABLE wallet_topup_orders ALTER COLUMN profile_id SET NOT NULL');
        Schema::table('wallet_topup_orders', function (Blueprint $table): void {
            $table->foreign('profile_id')->references('id')->on('profiles')->cascadeOnDelete();
            $table->dropColumn('account_id');
        });
    }

    private function removeAccountScopeFromCoinTransactions(): void
    {
        DB::statement('DELETE FROM coin_transactions WHERE profile_id IS NULL');
        DB::statement(<<<'SQL'
            WITH ordered AS (
                SELECT id, SUM(delta) OVER (
                    PARTITION BY profile_id
                    ORDER BY id
                    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                ) AS running_balance
                FROM coin_transactions
            )
            UPDATE coin_transactions
            SET balance_after = ordered.running_balance
            FROM ordered
            WHERE coin_transactions.id = ordered.id
        SQL);

        Schema::table('coin_transactions', function (Blueprint $table): void {
            $table->dropForeign(['profile_id']);
            $table->dropForeign(['account_id']);
        });
        DB::statement('ALTER TABLE coin_transactions ALTER COLUMN profile_id SET NOT NULL');
        Schema::table('coin_transactions', function (Blueprint $table): void {
            $table->foreign('profile_id')->references('id')->on('profiles')->cascadeOnDelete();
            $table->dropColumn('account_id');
        });
    }
};
