<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Notification;
use App\Models\User;

/**
 * Notifications belong to a profile, not directly to a user. A user owns
 * a notification iff its profile_id matches one of the user's profiles.
 *
 * We trust active_profile_id on the User \u2014 every authenticated request goes
 * through the active-profile middleware which validates ownership.
 */
final class NotificationPolicy
{
    public function update(User $user, Notification $notification): bool
    {
        return $this->owns($user, $notification);
    }

    public function delete(User $user, Notification $notification): bool
    {
        return $this->owns($user, $notification);
    }

    private function owns(User $user, Notification $notification): bool
    {
        return $notification->profile_id === $user->active_profile_id;
    }
}
