<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $key = 'profile.max_profiles_per_account';
        if (DB::table('system_configs')->where('key', $key)->exists()) {
            return;
        }

        DB::table('system_configs')->insert([
            'key' => $key,
            'value' => json_encode(5, JSON_THROW_ON_ERROR),
            'description' => 'Số hồ sơ tối đa mỗi tài khoản học viên được tạo.',
            'updated_at' => now(),
        ]);
    }

    public function down(): void {}
};
