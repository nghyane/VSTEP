<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Device;

class DeviceService
{
    public function create(string $userId, array $data): Device
    {
        return Device::updateOrCreate(
            ['token' => $data['token']],
            ['user_id' => $userId, 'platform' => $data['platform']],
        );
    }

    public function delete(Device $device): void
    {
        $device->delete();
    }
}
