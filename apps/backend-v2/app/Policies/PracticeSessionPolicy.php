<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\PracticeSession;
use App\Models\User;

class PracticeSessionPolicy
{
    public function view(User $user, PracticeSession $session): bool
    {
        return $user->id === $session->user_id;
    }
}
