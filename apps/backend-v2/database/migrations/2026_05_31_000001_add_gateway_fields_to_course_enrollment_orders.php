<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_enrollment_orders', function (Blueprint $table) {
            $table->unsignedBigInteger('order_code')->nullable()->unique()->after('id');
            $table->text('payment_url')->nullable()->after('provider_ref');
            $table->string('gateway_transaction_id', 100)->nullable()->after('payment_url');
            $table->jsonb('gateway_response')->nullable()->after('gateway_transaction_id');
            $table->timestamp('callback_received_at')->nullable()->after('gateway_response');
            $table->timestamp('expires_at')->nullable()->after('callback_received_at');

            $table->index(['payment_provider', 'gateway_transaction_id'], 'idx_course_order_gateway_txn');
        });
    }

    public function down(): void
    {
        Schema::table('course_enrollment_orders', function (Blueprint $table) {
            $table->dropIndex('idx_course_order_gateway_txn');
            $table->dropUnique(['order_code']);
            $table->dropColumn([
                'order_code',
                'payment_url',
                'gateway_transaction_id',
                'gateway_response',
                'callback_received_at',
                'expires_at',
            ]);
        });
    }
};
