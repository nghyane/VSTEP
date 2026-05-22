<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class NotificationController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService) {}

    public function index(Request $request): JsonResponse
    {
        $profile = $request->profile();
        $notifications = Notification::query()
            ->where('profile_id', $profile->id)
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($notifications);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json(['data' => [
            'count' => $this->notificationService->unreadCount($request->profile()),
        ]]);
    }

    public function readAll(Request $request): JsonResponse
    {
        $count = $this->notificationService->markAllRead($request->profile());

        return response()->json(['data' => ['marked' => $count]]);
    }

    public function read(Request $request, Notification $notification): JsonResponse
    {
        Gate::authorize('update', $notification);

        $ok = $this->notificationService->markRead($notification);

        return response()->json(['data' => ['marked' => $ok]]);
    }

    public function destroy(Request $request, Notification $notification): JsonResponse
    {
        Gate::authorize('delete', $notification);

        $notification->delete();

        return response()->json(['data' => ['success' => true]]);
    }
}
