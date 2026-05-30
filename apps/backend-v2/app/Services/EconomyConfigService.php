<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\SystemConfig;

final class EconomyConfigService
{
    public function examFullTestCost(): int
    {
        return $this->requiredInt('exam.full_test_cost_coins', 0);
    }

    public function examCustomPerSkillCost(): int
    {
        return $this->requiredInt('exam.custom_per_skill_coins', 0);
    }

    public function practiceFeedbackCost(): int
    {
        return $this->requiredInt('practice.feedback_cost_coins', 1);
    }

    public function onboardingInitialCoins(): int
    {
        return $this->requiredInt('onboarding.initial_coins', 0);
    }

    private function requiredInt(string $key, int $min): int
    {
        $value = SystemConfig::get($key);

        if (! is_int($value) || $value < $min) {
            throw new \RuntimeException("Missing or invalid system config: {$key}.");
        }

        return $value;
    }
}
