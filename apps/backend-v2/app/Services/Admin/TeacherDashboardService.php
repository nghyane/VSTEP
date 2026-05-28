<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Enums\BookingStatus;
use App\Enums\LeaveRequestStatus;
use App\Models\CourseScheduleItem;
use App\Models\TeacherBooking;
use App\Models\TeacherLeaveRequest;
use App\Models\TeacherSlot;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

final class TeacherDashboardService
{
    public function stats(User $teacher): array
    {
        $today = Carbon::today('Asia/Ho_Chi_Minh');

        return [
            'today_slots' => TeacherSlot::query()
                ->where('teacher_id', $teacher->id)
                ->whereDate('starts_at', $today)
                ->count(),
            'upcoming_bookings' => TeacherBooking::query()
                ->whereHas('slot', fn ($q) => $q->where('teacher_id', $teacher->id))
                ->where('status', BookingStatus::Booked)
                ->whereHas('slot', fn ($q) => $q->where('starts_at', '>', now()))
                ->count(),
            'pending_leaves' => TeacherLeaveRequest::query()
                ->where('teacher_id', $teacher->id)
                ->where('status', LeaveRequestStatus::Pending)
                ->count(),
        ];
    }

    public function slots(User $teacher, ?string $from, ?string $to): LengthAwarePaginator
    {
        $query = TeacherSlot::query()
            ->where('teacher_id', $teacher->id)
            ->with('course:id,title')
            ->with(['bookings' => fn ($q) => $q
                ->whereIn('status', BookingStatus::activeValues())
                ->with('profile.account:id,full_name'),
            ])
            ->orderBy('starts_at');

        if ($from) {
            $query->where('starts_at', '>=', $from);
        }
        if ($to) {
            $query->where('starts_at', '<=', $to);
        }

        return $query->paginate(50);
    }

    public function scheduleItems(User $teacher, ?string $from, ?string $to): LengthAwarePaginator
    {
        $query = CourseScheduleItem::query()
            ->whereHas('course', fn ($q) => $q->where('teacher_id', $teacher->id))
            ->with('course:id,title,livestream_url')
            ->orderBy('date')
            ->orderBy('start_time');

        if ($from) {
            $query->whereDate('date', '>=', Carbon::parse($from)->setTimezone('Asia/Ho_Chi_Minh')->toDateString());
        }
        if ($to) {
            $query->whereDate('date', '<=', Carbon::parse($to)->setTimezone('Asia/Ho_Chi_Minh')->toDateString());
        }

        return $query->paginate(100);
    }

    public function bookings(User $teacher, ?string $status): LengthAwarePaginator
    {
        $query = TeacherBooking::query()
            ->whereHas('slot', fn ($q) => $q->where('teacher_id', $teacher->id))
            ->with('slot:id,starts_at,duration_minutes,course_id', 'slot.course:id,title', 'profile.account:id,full_name')
            ->orderByDesc('booked_at');

        if ($status) {
            $query->where('status', $status);
        }

        return $query->paginate(20);
    }

    public function leaveRequests(User $teacher): LengthAwarePaginator
    {
        return TeacherLeaveRequest::query()
            ->where('teacher_id', $teacher->id)
            ->orderByDesc('date')
            ->paginate(20);
    }

    public function storeLeaveRequest(User $teacher, string $date, ?string $reason): TeacherLeaveRequest
    {
        return TeacherLeaveRequest::firstOrCreate(
            ['teacher_id' => $teacher->id, 'date' => $date],
            [
                'reason' => $reason,
                'status' => LeaveRequestStatus::Pending,
            ],
        );
    }

    /**
     * Staff: list all leave requests with optional filters.
     */
    public function listAllLeaveRequests(
        ?string $status = null,
        ?string $teacherId = null,
        ?string $from = null,
        ?string $to = null,
    ): LengthAwarePaginator {
        $query = TeacherLeaveRequest::query()
            ->with('teacher:id,full_name,email')
            ->orderByDesc('date');

        if ($status) {
            $query->where('status', $status);
        }
        if ($teacherId) {
            $query->where('teacher_id', $teacherId);
        }
        if ($from) {
            $query->whereDate('date', '>=', $from);
        }
        if ($to) {
            $query->whereDate('date', '<=', $to);
        }

        return $query->paginate(30);
    }

    /**
     * Staff: approve or reject a leave request.
     */
    public function updateLeaveRequestStatus(
        TeacherLeaveRequest $leave,
        LeaveRequestStatus $status,
        User $reviewer,
    ): TeacherLeaveRequest {
        if ($leave->status !== LeaveRequestStatus::Pending) {
            throw new UnprocessableEntityHttpException('Chỉ có thể duyệt/từ chối đơn đang ở trạng thái chờ.');
        }

        $leave->update([
            'status' => $status,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
        ]);

        return $leave->fresh();
    }
}
