<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\Submission;
use App\Models\User;

class SubmissionPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Submission $submission): bool
    {
        return $user->id === $submission->user_id || $user->role->is(Role::Admin);
    }
}
