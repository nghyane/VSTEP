<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\NotificationType;
use App\Models\Notification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class NotificationService
{
    public function send(string $userId, NotificationType $type, string $title, ?string $body = null, ?array $data = null): Notification
    {
        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);
    }

    public function list(string $userId, bool $unreadOnly = false): LengthAwarePaginator
    {
        return Notification::forUser($userId)
            ->when($unreadOnly, fn ($q) => $q->unread())
            ->orderByDesc('created_at')
            ->paginate();
    }

    public function unreadCount(string $userId): int
    {
        return Notification::forUser($userId)->unread()->count();
    }

    public function markRead(Notification $notification): Notification
    {
        $notification->update(['read_at' => now()]);

        return $notification;
    }

    public function markAllRead(string $userId): int
    {
        return Notification::forUser($userId)
            ->unread()
            ->update(['read_at' => now()]);
    }
}
