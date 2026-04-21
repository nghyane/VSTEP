<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Profile;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService) {}

    public function index(Request $request): JsonResponse
    {
        $profile = $this->profile($request);
        $notifications = Notification::query()
            ->where('profile_id', $profile->id)
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json([
            'data' => $notifications->items(),
            'total' => $notifications->total(),
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json(['data' => [
            'count' => $this->notificationService->unreadCount($this->profile($request)),
        ]]);
    }

    public function readAll(Request $request): JsonResponse
    {
        $count = $this->notificationService->markAllRead($this->profile($request));

        return response()->json(['data' => ['marked' => $count]]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $notif = Notification::query()->findOrFail($id);
        if ((string) $notif->profile_id !== $this->profile($request)->id) {
            abort(403);
        }
        $notif->delete();

        return response()->json(['data' => ['success' => true]]);
    }

    private function profile(Request $request): Profile
    {
        return $request->attributes->get('active_profile');
    }
}
