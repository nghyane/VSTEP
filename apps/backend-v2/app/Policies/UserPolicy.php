<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\User;

class UserPolicy
{
    public function view(User $auth, User $user): bool
    {
        return $auth->id === $user->id || $auth->role->is(Role::Admin);
    }

    public function update(User $auth, User $user): bool
    {
        return $auth->id === $user->id || $auth->role->is(Role::Admin);
    }
}
