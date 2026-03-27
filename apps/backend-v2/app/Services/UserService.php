<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        return User::query()
            ->when($filters['role'] ?? null, fn ($q, $v) => $q->where('role', $v))
            ->when($filters['search'] ?? null, fn ($q, $v) => $q->where(
                fn ($q) => $q->where('full_name', 'ilike', "%{$v}%")->orWhere('email', 'ilike', "%{$v}%"),
            ))
            ->orderByDesc('created_at')
            ->paginate();
    }

    public function create(array $data): User
    {
        return User::create($data);
    }

    public function delete(User $user): void
    {
        $user->delete();
    }

    public function update(User $user, array $data): User
    {
        $user->update($data);

        return $user;
    }

    public function changePassword(User $user, string $currentPassword, string $newPassword): void
    {
        if (! Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $user->update(['password' => $newPassword]);
    }
}
