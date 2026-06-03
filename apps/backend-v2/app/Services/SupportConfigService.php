<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\SystemConfig;

final class SupportConfigService
{
    public function zaloPhone(): string
    {
        $value = SystemConfig::get('support.zalo_phone');

        if (! is_string($value) || trim($value) === '' || preg_replace('/\D+/', '', $value) === '') {
            throw new \RuntimeException('Missing or invalid system config: support.zalo_phone.');
        }

        return trim($value);
    }
}
