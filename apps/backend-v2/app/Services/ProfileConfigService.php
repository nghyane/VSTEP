<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\SystemConfig;

final class ProfileConfigService
{
    public const MAX_PROFILES_PER_ACCOUNT_KEY = 'profile.max_profiles_per_account';

    public function maxProfilesPerAccount(): int
    {
        return $this->requiredInt(self::MAX_PROFILES_PER_ACCOUNT_KEY, 1);
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
