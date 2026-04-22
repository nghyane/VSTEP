<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SystemConfig;
use Illuminate\Http\JsonResponse;

class ConfigController extends Controller
{
    /**
     * Trả exam cost config để FE hiển thị trước khi bấm thi.
     * Giá trị do admin set qua Filament — không hardcode ở FE.
     */
    public function examCosts(): JsonResponse
    {
        return response()->json([
            'data' => [
                'full_test_coin_cost' => (int) (SystemConfig::get('exam.full_test_cost_coins') ?? 25),
                'per_skill_coin_cost' => (int) (SystemConfig::get('exam.custom_per_skill_coins') ?? 8),
            ],
        ]);
    }
}
