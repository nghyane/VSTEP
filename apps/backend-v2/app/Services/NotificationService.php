<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\IconKey;
use App\Enums\NotificationType;
use App\Models\Notification;
use App\Models\Profile;

final class NotificationService
{
    /**
     * Push notification. Dedup by dedup_key per profile.
     */
    public function push(
        Profile $profile,
        NotificationType $type,
        string $title,
        ?string $body = null,
        IconKey $iconKey = IconKey::Coin,
        ?array $payload = null,
        ?string $dedupKey = null,
    ): ?Notification {
        if ($dedupKey !== null) {
            $exists = Notification::query()
                ->where('profile_id', $profile->id)
                ->where('dedup_key', $dedupKey)
                ->exists();
            if ($exists) {
                return null;
            }
        }

        return Notification::create([
            'profile_id' => $profile->id,
            'type' => $type->value,
            'title' => $title,
            'body' => $body,
            'icon_key' => $iconKey->value,
            'payload' => $payload,
            'dedup_key' => $dedupKey,
        ]);
    }

    public function markAllRead(Profile $profile): int
    {
        return Notification::query()
            ->where('profile_id', $profile->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function markRead(Profile $profile, string $notificationId): bool
    {
        return Notification::query()
            ->where('profile_id', $profile->id)
            ->where('id', $notificationId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]) > 0;
    }

    public function unreadCount(Profile $profile): int
    {
        return Notification::query()
            ->where('profile_id', $profile->id)
            ->whereNull('read_at')
            ->count();
    }
}
