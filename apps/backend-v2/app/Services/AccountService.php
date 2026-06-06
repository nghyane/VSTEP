<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;

final class AccountService
{
    /**
     * @param  array{phone_number?:string|null}  $data
     */
    public function update(User $user, array $data): User
    {
        $user->fill($data);
        $user->save();

        return $user->refresh();
    }

    public function changePassword(User $user, string $password): void
    {
        $user->password = $password;
        $user->save();
    }
}
