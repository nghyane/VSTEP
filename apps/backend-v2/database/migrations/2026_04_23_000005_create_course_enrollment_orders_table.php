<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Course enrollment order — mock VND payment.
 * Status: pending → paid | failed | expired
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_enrollment_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('course_id')->constrained()->restrictOnDelete();
            $table->integer('amount_vnd');
            $table->string('status', 20)->default('pending');
            $table->string('payment_provider', 30)->default('mock');
            $table->string('provider_ref', 64)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['profile_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_enrollment_orders');
    }
};
