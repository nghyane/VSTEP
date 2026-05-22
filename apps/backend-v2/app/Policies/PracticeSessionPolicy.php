<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\PracticeSession;
use App\Models\User;

final class PracticeSessionPolicy
{
    public function view(User $user, PracticeSession $session): bool
    {
        return $this->owns($user, $session);
    }

    public function update(User $user, PracticeSession $session): bool
    {
        return $this->owns($user, $session);
    }

    public function submit(User $user, PracticeSession $session): bool
    {
        return $this->owns($user, $session);
    }

    private function owns(User $user, PracticeSession $session): bool
    {
        return $user->active_profile_id !== null
            && $session->profile_id === $user->active_profile_id;
    }
}
