<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\ExamSession;
use App\Models\User;

class ExamSessionPolicy
{
    public function view(User $user, ExamSession $session): bool
    {
        return $user->id === $session->user_id;
    }

    public function update(User $user, ExamSession $session): bool
    {
        return $user->id === $session->user_id;
    }
}
