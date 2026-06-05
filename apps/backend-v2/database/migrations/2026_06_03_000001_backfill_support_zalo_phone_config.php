<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('system_configs')->where('key', 'support.zalo_phone')->exists()) {
            return;
        }

        DB::table('system_configs')->insert([
            'key' => 'support.zalo_phone',
            'value' => json_encode('0343062376', JSON_THROW_ON_ERROR),
            'description' => 'Số điện thoại Zalo dùng cho nút hỗ trợ học viên.',
            'updated_at' => now(),
        ]);
    }

    public function down(): void {}
};
