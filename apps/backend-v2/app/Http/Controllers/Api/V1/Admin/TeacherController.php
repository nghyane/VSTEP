<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Teacher\StoreLeaveRequestRequest;
use App\Http\Resources\Admin\TeacherScheduleItemResource;
use App\Services\Admin\TeacherDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class TeacherController extends Controller
{
    public function __construct(
        private readonly TeacherDashboardService $service,
    ) {}

    public function dashboard(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->service->stats($request->user())]);
    }

    public function slots(Request $request): JsonResponse
    {
        $paginator = $this->service->slots(
            $request->user(),
            $request->input('from'),
            $request->input('to'),
        );

        return response()->json(['data' => $paginator]);
    }

    public function scheduleItems(Request $request): AnonymousResourceCollection
    {
        return TeacherScheduleItemResource::collection(
            $this->service->scheduleItems(
                $request->user(),
                $request->input('from'),
                $request->input('to'),
            ),
        );
    }

    public function bookings(Request $request): JsonResponse
    {
        $paginator = $this->service->bookings(
            $request->user(),
            $request->input('status'),
        );

        return response()->json(['data' => $paginator]);
    }

    public function leaveRequests(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->service->leaveRequests($request->user())]);
    }

    public function storeLeaveRequest(StoreLeaveRequestRequest $request): JsonResponse
    {
        $leave = $this->service->storeLeaveRequest(
            $request->user(),
            $request->validated('date'),
            $request->validated('reason'),
        );

        return response()->json(['data' => $leave], 201);
    }
}
