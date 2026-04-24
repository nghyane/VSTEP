<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Course enrollment order — mock VND payment.
 * Status: pending → paid | failed | expired
 *
 * Partial unique index: max 1 active (pending/paid) order per (profile, course).
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

        // Prevent duplicate active orders per (profile, course)
        DB::statement(
            "CREATE UNIQUE INDEX uq_course_order_active
             ON course_enrollment_orders (profile_id, course_id)
             WHERE status IN ('pending', 'paid')"
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS uq_course_order_active');
        Schema::dropIfExists('course_enrollment_orders');
    }
};
