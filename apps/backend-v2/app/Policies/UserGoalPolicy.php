<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;
use App\Models\UserGoal;

class UserGoalPolicy
{
    public function view(User $user, UserGoal $goal): bool
    {
        return $user->id === $goal->user_id;
    }

    public function update(User $user, UserGoal $goal): bool
    {
        return $user->id === $goal->user_id;
    }

    public function delete(User $user, UserGoal $goal): bool
    {
        return $user->id === $goal->user_id;
    }
}
