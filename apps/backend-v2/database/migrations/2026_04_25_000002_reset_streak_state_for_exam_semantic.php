<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * RFC 0019 follow-up: streak nguồn đổi từ drill practice → full-test exam.
 * Reset toàn bộ snapshot vì current/longest cũ tính theo drill, không tương đương.
 * profile_streak_logs cũ giữ nguyên (append-only log, không xóa).
 *
 * Down: không thể rollback semantic data — no-op.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('profile_streak_state')->update([
            'current_streak' => 0,
            'longest_streak' => 0,
            'last_active_date_local' => null,
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        // No-op: semantic shift is one-way.
    }
};
