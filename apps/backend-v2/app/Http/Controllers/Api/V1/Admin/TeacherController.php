<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\LeaveRequestStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Teacher\StoreLeaveRequestRequest;
use App\Http\Requests\Admin\Teacher\UpdateLeaveRequestStatusRequest;
use App\Http\Resources\Admin\TeacherScheduleItemResource;
use App\Models\TeacherLeaveRequest;
use App\Models\User;
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
        return response()->json(['data' => $this->service->stats($this->teacherFrom($request))]);
    }

    public function slots(Request $request): JsonResponse
    {
        $paginator = $this->service->slots(
            $this->teacherFrom($request),
            $request->input('from'),
            $request->input('to'),
        );

        return response()->json(['data' => $paginator]);
    }

    public function scheduleItems(Request $request): AnonymousResourceCollection
    {
        return TeacherScheduleItemResource::collection(
            $this->service->scheduleItems(
                $this->teacherFrom($request),
                $request->input('from'),
                $request->input('to'),
            ),
        );
    }

    public function bookings(Request $request): JsonResponse
    {
        $paginator = $this->service->bookings(
            $this->teacherFrom($request),
            $request->input('status'),
        );

        return response()->json(['data' => $paginator]);
    }

    public function leaveRequests(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->service->leaveRequests($this->teacherFrom($request))]);
    }

    public function storeLeaveRequest(StoreLeaveRequestRequest $request): JsonResponse
    {
        $leave = $this->service->storeLeaveRequest(
            $this->teacherFrom($request),
            $request->validated('date'),
            $request->validated('reason'),
        );

        return response()->json(['data' => $leave], 201);
    }

    // ─── Staff: leave request management ──────────────────────────────

    public function staffLeaveRequests(Request $request): JsonResponse
    {
        $paginator = $this->service->listAllLeaveRequests(
            status: $request->input('status'),
            teacherId: $request->input('teacher_id'),
            from: $request->input('from'),
            to: $request->input('to'),
        );

        return response()->json(['data' => $paginator]);
    }

    public function staffUpdateLeaveRequest(
        UpdateLeaveRequestStatusRequest $request,
        string $leaveId,
    ): JsonResponse {
        /** @var TeacherLeaveRequest $leave */
        $leave = TeacherLeaveRequest::query()->findOrFail($leaveId);

        $updated = $this->service->updateLeaveRequestStatus(
            $leave,
            $request->enum('status', LeaveRequestStatus::class),
            $request->user(),
        );

        return response()->json(['data' => $updated]);
    }

    private function teacherFrom(Request $request): User
    {
        $user = $request->user();

        if (! $user instanceof User || $user->role !== Role::Teacher) {
            abort(403, 'Teacher account required.');
        }

        return $user;
    }
}
