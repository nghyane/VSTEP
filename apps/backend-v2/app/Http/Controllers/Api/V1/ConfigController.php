<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\EconomyConfigService;
use App\Services\ProfileConfigService;
use App\Services\SupportConfigService;
use Illuminate\Http\JsonResponse;

final class ConfigController extends Controller
{
    public function __construct(
        private readonly EconomyConfigService $economyConfig,
        private readonly ProfileConfigService $profileConfig,
        private readonly SupportConfigService $supportConfig,
    ) {}

    public function show(): JsonResponse
    {
        $fullTestCost = $this->economyConfig->examFullTestCost();
        $customPerSkillCost = $this->economyConfig->examCustomPerSkillCost();

        return response()->json([
            'data' => [
                'wallet' => [
                    'onboarding_initial_coins' => $this->economyConfig->onboardingInitialCoins(),
                ],
                'profile' => [
                    'max_profiles_per_account' => $this->profileConfig->maxProfilesPerAccount(),
                ],
                'support' => [
                    'zalo_phone' => $this->supportConfig->zaloPhone(),
                ],
                'pricing' => [
                    'exam' => [
                        'full_test_cost_coins' => $fullTestCost,
                        'custom_per_skill_coins' => $customPerSkillCost,
                        'max_cost_coins' => $fullTestCost,
                    ],
                    'practice' => [
                        'feedback_cost_coins' => $this->economyConfig->practiceFeedbackCost(),
                    ],
                    'teacher_grading' => [
                        'request_cost_coins' => $this->economyConfig->teacherGradingRequestCost(),
                    ],
                ],
            ],
        ]);
    }
}
