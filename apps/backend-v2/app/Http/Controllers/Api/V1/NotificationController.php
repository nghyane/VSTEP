<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Authorize;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationService $service,
    ) {}

    public function index(Request $request)
    {
        return NotificationResource::collection(
            $this->service->list($request->user()->id, $request->boolean('unread_only')),
        );
    }

    public function unreadCount(Request $request)
    {
        return response()->json([
            'data' => ['count' => $this->service->unreadCount($request->user()->id)],
        ]);
    }

    #[Authorize('update', 'notification')]
    public function markRead(Notification $notification)
    {
        $this->service->markRead($notification);

        return response()->json(['data' => ['id' => $notification->id]]);
    }

    public function markAllRead(Request $request)
    {
        $updated = $this->service->markAllRead($request->user()->id);

        return response()->json(['data' => ['updated' => $updated]]);
    }
}
