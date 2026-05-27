<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AdminNotificationController extends Controller
{
    public function __construct(
        private readonly AdminNotificationService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = max(1, min($request->integer('per_page', 20), 100));
        $notifications = $this->service->list($request->user(), $perPage);

        return response()->json([
            'data' => $notifications->items(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
                'last_page' => $notifications->lastPage(),
            ],
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'data' => ['count' => $this->service->unreadCount($request->user())],
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $count = $this->service->markAllRead($request->user());

        return response()->json([
            'data' => ['marked' => $count],
        ]);
    }
}
