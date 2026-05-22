<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\ExamSession;
use App\Models\User;

final class ExamSessionPolicy
{
    public function view(User $user, ExamSession $session): bool
    {
        return $this->owns($user, $session);
    }

    public function update(User $user, ExamSession $session): bool
    {
        return $this->owns($user, $session);
    }

    private function owns(User $user, ExamSession $session): bool
    {
        return $user->active_profile_id !== null
            && $session->profile_id === $user->active_profile_id;
    }
}
