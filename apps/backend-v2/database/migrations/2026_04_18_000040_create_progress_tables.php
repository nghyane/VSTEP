<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_daily_activity', function (Blueprint $table) {
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->date('date_local');
            $table->integer('drill_session_count')->default(0);
            $table->integer('drill_duration_seconds')->default(0);
            $table->timestamp('updated_at')->useCurrent();

            $table->primary(['profile_id', 'date_local']);
        });

        Schema::create('profile_streak_state', function (Blueprint $table) {
            $table->foreignUuid('profile_id')->primary()->constrained()->cascadeOnDelete();
            $table->integer('current_streak')->default(0);
            $table->integer('longest_streak')->default(0);
            $table->date('last_active_date_local')->nullable();
            $table->timestamp('updated_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_streak_state');
        Schema::dropIfExists('profile_daily_activity');
    }
};
