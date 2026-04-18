<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Gói nạp VND → xu. Admin CRUD qua admin panel.
 * coins_base + bonus_coins = coins_to_credit.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallet_topup_packages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('label', 50);
            $table->integer('amount_vnd');
            $table->integer('coins_base');
            $table->integer('bonus_coins')->default(0);
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'display_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_topup_packages');
    }
};
