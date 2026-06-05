<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class NotificationController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return NotificationResource::collection($this->notificationService->list($request->profile()));
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
        $ok = $this->notificationService->markRead($request->profile(), $notification);

        return response()->json(['data' => ['marked' => $ok]]);
    }

    public function destroy(Request $request, Notification $notification): JsonResponse
    {
        $this->notificationService->delete($request->profile(), $notification);

        return response()->json(['data' => ['success' => true]]);
    }
}
