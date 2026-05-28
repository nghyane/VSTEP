<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\AdminNotificationType;
use App\Enums\IconKey;
use App\Models\AdminNotification;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class AdminNotificationService
{
    /**
     * Push notification cho một user (admin/teacher).
     * Dedup by dedup_key per user.
     */
    public function push(
        User $user,
        AdminNotificationType $type,
        string $title,
        ?string $body = null,
        IconKey $iconKey = IconKey::Calendar,
        ?array $payload = null,
        ?string $dedupKey = null,
    ): ?AdminNotification {
        if ($dedupKey !== null) {
            $exists = AdminNotification::query()
                ->where('user_id', $user->id)
                ->where('dedup_key', $dedupKey)
                ->exists();
            if ($exists) {
                return null;
            }
        }

        return AdminNotification::create([
            'user_id' => $user->id,
            'type' => $type->value,
            'title' => $title,
            'body' => $body,
            'icon_key' => $iconKey->value,
            'payload' => $payload,
            'dedup_key' => $dedupKey,
        ]);
    }

    public function markAllRead(User $user): int
    {
        return AdminNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function unreadCount(User $user): int
    {
        return AdminNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();
    }

    /**
     * @return LengthAwarePaginator
     */
    public function list(User $user, int $perPage = 20): mixed
    {
        return AdminNotification::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }
}
