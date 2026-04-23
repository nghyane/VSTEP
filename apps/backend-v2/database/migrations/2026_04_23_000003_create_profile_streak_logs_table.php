<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Lịch sử streak theo ngày — dùng để render contribution graph,
 * streak calendar. Source of truth cho current/longest vẫn là
 * profile_streak_state. Bảng này là append-only log, không bị wipe
 * khi reset profile.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_streak_logs', function (Blueprint $table) {
            $table->foreignUuid('profile_id')->constrained()->cascadeOnDelete();
            $table->date('date_local');
            $table->boolean('active')->default(false);
            $table->timestamp('created_at')->useCurrent();

            $table->primary(['profile_id', 'date_local']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_streak_logs');
    }
};
