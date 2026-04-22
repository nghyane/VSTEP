<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SystemConfig;
use Illuminate\Http\JsonResponse;

class MetaController extends Controller
{
    public function economy(): JsonResponse
    {
        $fullTestCost = (int) (SystemConfig::get('exam.full_test_cost_coins') ?? 25);
        $customPerSkillCost = (int) (SystemConfig::get('exam.custom_per_skill_coins') ?? 8);
        $supportLevelCosts = SystemConfig::get('support.level_costs') ?? [];
        $supportLevelCosts = is_array($supportLevelCosts) ? $supportLevelCosts : [];

        return response()->json([
            'data' => [
                'wallet' => [
                    'onboarding_initial_coins' => (int) (SystemConfig::get('onboarding.initial_coins') ?? 0),
                ],
                'pricing' => [
                    'exam' => [
                        'full_test_cost_coins' => $fullTestCost,
                        'custom_per_skill_coins' => $customPerSkillCost,
                        'max_cost_coins' => $fullTestCost,
                    ],
                    'practice' => [
                        'support_level_costs' => $supportLevelCosts,
                    ],
                ],
            ],
        ]);
    }
}
