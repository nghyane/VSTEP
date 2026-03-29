<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\Role;
use App\Models\Classroom;
use App\Models\User;

class ClassroomPolicy
{
    public function view(User $user, Classroom $classroom): bool
    {
        return $user->role->is(Role::Admin)
            || $user->id === $classroom->instructor_id
            || $classroom->members()->where('user_id', $user->id)->exists();
    }

    public function update(User $user, Classroom $classroom): bool
    {
        return $user->role->is(Role::Admin)
            || $user->id === $classroom->instructor_id;
    }

    public function delete(User $user, Classroom $classroom): bool
    {
        return $user->role->is(Role::Admin)
            || $user->id === $classroom->instructor_id;
    }
}
