<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Append-only coin ledger. Balance = SUM(delta) WHERE profile_id = X.
 *
 * type ∈ (topup, onboarding_bonus, promo_redeem, admin_grant,
 *         support_level_use, exam_custom, exam_full, course_purchase)
 *
 * source_type/source_id: polymorphic trace về action tạo tx
 * (e.g. 'course_enrollment' / enrollment_id).
 *
 * balance_after: snapshot sau tx này. Luôn >= 0. Guard ở app-layer
 * bằng SELECT FOR UPDATE khi spend.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coin_transactions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->string('type', 30);
            $table->integer('delta');
            $table->integer('balance_after');
            $table->string('source_type', 40)->nullable();
            $table->string('source_id', 40)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['profile_id', 'created_at']);
            $table->index(['source_type', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coin_transactions');
    }
};
