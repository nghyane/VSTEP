<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Track milestone reward claims (7/14/30 ngày streak → +xu).
 * Idempotent: 1 claim per (profile, milestone_days). Append-only.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_streak_claims', function (Blueprint $table) {
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('milestone_days');
            $table->unsignedInteger('coins_granted');
            $table->foreignId('coin_transaction_id')->nullable()->constrained('coin_transactions')->nullOnDelete();
            $table->timestamp('claimed_at')->useCurrent();

            $table->primary(['profile_id', 'milestone_days']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_streak_claims');
    }
};
