<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wallet_topup_orders', function (Blueprint $table) {
            // PayOS requires integer orderCode — use BIGSERIAL for auto-increment.
            $table->bigInteger('order_code')->nullable()->unique()->after('id');

            $table->text('payment_url')->nullable()->after('provider_ref');
            $table->string('gateway_transaction_id', 100)->nullable()->after('payment_url');
            $table->jsonb('gateway_response')->nullable()->after('gateway_transaction_id');
            $table->timestamp('callback_received_at')->nullable()->after('gateway_response');
            $table->timestamp('expires_at')->nullable()->after('callback_received_at');

            $table->index(['payment_provider', 'gateway_transaction_id'], 'idx_topup_gateway_txn');
        });

        // Seed order_code values for existing orders (migration-safe).
        // New orders will get auto-increment via app-level sequence.
    }

    public function down(): void
    {
        Schema::table('wallet_topup_orders', function (Blueprint $table) {
            $table->dropIndex('idx_topup_gateway_txn');
            $table->dropColumn(['order_code', 'payment_url', 'gateway_transaction_id', 'gateway_response', 'callback_received_at', 'expires_at']);
        });
    }
};
