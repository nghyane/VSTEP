<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;

final class AccountService
{
    public function changePassword(User $user, string $password): void
    {
        $user->password = $password;
        $user->save();
    }
}
