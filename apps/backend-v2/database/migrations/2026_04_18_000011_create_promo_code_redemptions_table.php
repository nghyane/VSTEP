<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Promo redemption: track per account (chống farm bằng profile).
 * Xu chảy vào profile_id được chọn (thường = active profile).
 *
 * Unique (promo_code_id, account_id) cho per_account_limit = 1 case.
 * Nếu limit > 1: app-layer count + validate.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promo_code_redemptions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignUuid('promo_code_id')->constrained()->restrictOnDelete();
            $table->foreignUuid('account_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->integer('coins_granted');
            $table->unsignedBigInteger('coin_transaction_id');
            $table->timestamp('redeemed_at');

            $table->foreign('coin_transaction_id')
                ->references('id')
                ->on('coin_transactions')
                ->restrictOnDelete();

            $table->unique(['promo_code_id', 'account_id']);
            $table->index('profile_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promo_code_redemptions');
    }
};
