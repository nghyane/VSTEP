<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * User order top-up. Phase 1 payment mock → status chuyển pending → paid ngay
 * khi callback nội bộ. Sau này integrate VNPay/MoMo.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallet_topup_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('package_id')->constrained('wallet_topup_packages')->restrictOnDelete();
            $table->integer('amount_vnd');
            $table->integer('coins_to_credit');
            $table->string('status', 20)->default('pending');
            $table->string('payment_provider', 30)->nullable();
            $table->string('provider_ref', 100)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['profile_id', 'created_at']);
            $table->index('provider_ref');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_topup_orders');
    }
};
