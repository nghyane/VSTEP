<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Soft-deactivate cho users. Hard-delete bị chặn theo policy
 * "không xóa người dùng" — đặc biệt teacher có khóa active sẽ phải
 * reassign trước, admin đồng cấp chỉ được khóa/mở. deactivated_at NULL
 * = active; có giá trị = bị khóa, không login được.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->timestamp('deactivated_at')->nullable()->after('email_verified_at');
            $table->index('deactivated_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex(['deactivated_at']);
            $table->dropColumn('deactivated_at');
        });
    }
};
