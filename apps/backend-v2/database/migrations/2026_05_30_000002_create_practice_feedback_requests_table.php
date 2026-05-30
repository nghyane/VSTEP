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
        Schema::create('practice_feedback_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('profile_id')->constrained('profiles')->cascadeOnDelete();
            $table->string('submission_type', 40);
            $table->uuid('submission_id');
            $table->string('status', 20);
            $table->foreignId('coin_transaction_id')->nullable()->constrained('coin_transactions')->nullOnDelete();
            $table->text('last_error')->nullable();
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamps();

            $table->unique(['submission_type', 'submission_id'], 'uq_practice_feedback_submission');
            $table->index(['profile_id', 'status']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE coin_transactions DROP CONSTRAINT IF EXISTS coin_transactions_type_valid');
            DB::statement("ALTER TABLE coin_transactions ADD CONSTRAINT coin_transactions_type_valid CHECK (type IN ('topup', 'onboarding_bonus', 'course_bonus', 'promo_redeem', 'admin_grant', 'streak_milestone', 'refund', 'support_level_use', 'exam_custom', 'exam_full', 'course_purchase', 'teacher_booking', 'practice_feedback'))");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE coin_transactions DROP CONSTRAINT IF EXISTS coin_transactions_type_valid');
            DB::statement("ALTER TABLE coin_transactions ADD CONSTRAINT coin_transactions_type_valid CHECK (type IN ('topup', 'onboarding_bonus', 'course_bonus', 'promo_redeem', 'admin_grant', 'streak_milestone', 'refund', 'support_level_use', 'exam_custom', 'exam_full', 'course_purchase', 'teacher_booking'))");
        }

        Schema::dropIfExists('practice_feedback_requests');
    }
};
