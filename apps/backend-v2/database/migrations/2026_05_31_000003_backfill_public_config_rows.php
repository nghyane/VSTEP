<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $defaults = [
            'exam.full_test_cost_coins' => [25, 'Xu/lần thi Full VSTEP (4 kỹ năng).'],
            'exam.custom_per_skill_coins' => [8, 'Xu/kỹ năng khi thi Custom VSTEP.'],
            'practice.feedback_cost_coins' => [1, 'Xu/lần yêu cầu AI feedback chi tiết cho bài luyện tập.'],
            'onboarding.initial_coins' => [100, 'Xu tặng khi tạo profile đầu tiên của account.'],
        ];

        foreach ($defaults as $key => [$value, $description]) {
            if (DB::table('system_configs')->where('key', $key)->exists()) {
                continue;
            }

            DB::table('system_configs')->insert([
                'key' => $key,
                'value' => json_encode($value, JSON_THROW_ON_ERROR),
                'description' => $description,
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void {}
};
