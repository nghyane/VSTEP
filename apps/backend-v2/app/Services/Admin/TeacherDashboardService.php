<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Enums\LeaveRequestStatus;
use App\Enums\SlotStatus;
use App\Models\TeacherBooking;
use App\Models\TeacherLeaveRequest;
use App\Models\TeacherSlot;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

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
            'upcoming_bookings' => TeacherSlot::query()
                ->where('teacher_id', $teacher->id)
                ->where('starts_at', '>', now())
                ->where('status', SlotStatus::Booked)
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
            ->with('course:id,title', 'bookings.profile.account:id,full_name')
            ->orderBy('starts_at');

        if ($from) {
            $query->where('starts_at', '>=', $from);
        }
        if ($to) {
            $query->where('starts_at', '<=', $to);
        }

        return $query->paginate(50);
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
        return TeacherLeaveRequest::create([
            'teacher_id' => $teacher->id,
            'date' => $date,
            'reason' => $reason,
            'status' => LeaveRequestStatus::Pending,
        ]);
    }
}
