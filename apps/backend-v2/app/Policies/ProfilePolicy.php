<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Profile;
use App\Models\User;

final class ProfilePolicy
{
    public function view(User $user, Profile $profile): bool
    {
        return $this->owns($user, $profile);
    }

    public function update(User $user, Profile $profile): bool
    {
        return $this->owns($user, $profile);
    }

    public function delete(User $user, Profile $profile): bool
    {
        return $this->owns($user, $profile);
    }

    public function reset(User $user, Profile $profile): bool
    {
        return $this->owns($user, $profile);
    }

    private function owns(User $user, Profile $profile): bool
    {
        return $profile->account_id === $user->id;
    }
}
