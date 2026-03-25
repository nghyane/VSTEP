<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Device;
use App\Models\User;

class DevicePolicy
{
    public function delete(User $user, Device $device): bool
    {
        return $user->id === $device->user_id;
    }
}
