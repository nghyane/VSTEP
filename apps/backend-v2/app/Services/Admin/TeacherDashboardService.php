<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Enums\AdminNotificationType;
use App\Enums\BookingStatus;
use App\Enums\CoinSourceType;
use App\Enums\CoinTransactionType;
use App\Enums\IconKey;
use App\Enums\LeaveRequestStatus;
use App\Enums\Role;
use App\Enums\SlotStatus;
use App\Models\CoinTransaction;
use App\Models\CourseEnrollment;
use App\Models\CourseScheduleItem;
use App\Models\TeacherBooking;
use App\Models\TeacherLeaveRequest;
use App\Models\TeacherSlot;
use App\Models\User;
use App\Services\AdminNotificationService;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

final class TeacherDashboardService
{
    public function __construct(private readonly AdminNotificationService $adminNotifications) {}

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
        $leave = TeacherLeaveRequest::firstOrCreate(
            ['teacher_id' => $teacher->id, 'date' => $date],
            [
                'reason' => $reason,
                'status' => LeaveRequestStatus::Pending,
            ],
        );

        if ($leave->wasRecentlyCreated) {
            $this->notifyStaffLeaveRequestCreated($leave, $teacher);
        }

        return $leave;
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

        $paginator = $query->paginate(30);
        $paginator->getCollection()->transform(function (TeacherLeaveRequest $leave): TeacherLeaveRequest {
            $leave->setAttribute('impact_summary', $this->impactSummary($leave));

            return $leave;
        });

        return $paginator;
    }

    public function leaveRequestDetail(TeacherLeaveRequest $leave, User $viewer): array
    {
        $leave->loadMissing('teacher:id,full_name,email');

        return [
            'leave' => $leave,
            'summary' => $this->impactSummary($leave),
            'impacts' => [
                'schedule_items' => $this->impactedScheduleItems($leave),
                'bookings' => $this->impactedBookings($leave, $viewer),
                'open_slots' => $this->impactedOpenSlots($leave),
            ],
        ];
    }

    public function teacherDaySchedule(User $teacher, string $date): array
    {
        $day = Carbon::parse($date)->toDateString();

        return [
            'schedule_items' => CourseScheduleItem::query()
                ->whereDate('date', $day)
                ->whereHas('course', fn ($q) => $q->where('teacher_id', $teacher->id))
                ->with('course:id,title')
                ->orderBy('start_time')
                ->get()
                ->map(fn (CourseScheduleItem $item): array => [
                    'id' => $item->id,
                    'course_id' => $item->course_id,
                    'course_title' => $item->course?->title,
                    'date' => $item->date->toDateString(),
                    'start_time' => substr((string) $item->start_time, 0, 5),
                    'end_time' => substr((string) $item->end_time, 0, 5),
                    'topic' => $item->topic,
                    'status' => $item->status ?? 'scheduled',
                ])
                ->all(),
            'slots' => TeacherSlot::query()
                ->where('teacher_id', $teacher->id)
                ->whereDate('starts_at', $day)
                ->with('course:id,title')
                ->orderBy('starts_at')
                ->get()
                ->map(fn (TeacherSlot $slot): array => [
                    'id' => $slot->id,
                    'course_id' => $slot->course_id,
                    'course_title' => $slot->course?->title,
                    'starts_at' => $slot->starts_at->toIso8601String(),
                    'duration_minutes' => (int) $slot->duration_minutes,
                    'status' => $slot->status->value,
                ])
                ->all(),
        ];
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

    private function impactSummary(TeacherLeaveRequest $leave): array
    {
        return [
            'schedule_items_count' => $this->scheduleItemsQuery($leave)->count(),
            'bookings_count' => $this->bookingsQuery($leave)->count(),
            'open_slots_count' => $this->openSlotsQuery($leave)->count(),
        ];
    }

    private function impactedScheduleItems(TeacherLeaveRequest $leave): array
    {
        return $this->scheduleItemsQuery($leave)
            ->with('course:id,title,teacher_id')
            ->orderBy('start_time')
            ->get()
            ->map(function (CourseScheduleItem $item): array {
                return [
                    'id' => $item->id,
                    'course_id' => $item->course_id,
                    'course_title' => $item->course?->title,
                    'session_number' => (int) $item->session_number,
                    'date' => $item->date->toDateString(),
                    'start_time' => substr((string) $item->start_time, 0, 5),
                    'end_time' => substr((string) $item->end_time, 0, 5),
                    'topic' => $item->topic,
                    'status' => $item->status ?? 'scheduled',
                    'cancel_reason' => $item->cancel_reason,
                    'learners' => $this->courseLearners($item->course_id),
                ];
            })
            ->all();
    }

    private function impactedBookings(TeacherLeaveRequest $leave, User $viewer): array
    {
        $isAdmin = $viewer->role === Role::Admin;

        return $this->bookingsQuery($leave)
            ->with(['slot.course:id,title', 'profile.account:id,full_name,email,phone_number'])
            ->orderBy('booked_at')
            ->get()
            ->map(function (TeacherBooking $booking) use ($isAdmin): array {
                $profile = $booking->profile;
                $account = $profile?->account;
                $row = [
                    'id' => $booking->id,
                    'status' => $booking->status->value,
                    'meet_url' => $booking->meet_url,
                    'slot' => [
                        'id' => $booking->slot?->id,
                        'course_id' => $booking->slot?->course_id,
                        'course_title' => $booking->slot?->course?->title,
                        'starts_at' => $booking->slot?->starts_at?->toIso8601String(),
                        'duration_minutes' => (int) ($booking->slot?->duration_minutes ?? 0),
                    ],
                    'learner' => [
                        'profile_id' => $profile?->id,
                        'full_name' => $account?->full_name ?? $profile?->nickname,
                        'email' => $account?->email,
                        'phone_number' => $account?->phone_number,
                    ],
                ];

                if ($isAdmin) {
                    $row['coins_paid'] = $this->bookingCoinsPaid($booking);
                    $row['refund_status'] = $this->bookingRefunded($booking) ? 'refunded' : 'not_refunded';
                }

                return $row;
            })
            ->all();
    }

    private function impactedOpenSlots(TeacherLeaveRequest $leave): array
    {
        return $this->openSlotsQuery($leave)
            ->with('course:id,title')
            ->orderBy('starts_at')
            ->get()
            ->map(fn (TeacherSlot $slot): array => [
                'id' => $slot->id,
                'teacher_id' => $slot->teacher_id,
                'course_id' => $slot->course_id,
                'course_title' => $slot->course?->title,
                'starts_at' => $slot->starts_at->toIso8601String(),
                'duration_minutes' => (int) $slot->duration_minutes,
                'status' => $slot->status->value,
            ])
            ->all();
    }

    private function scheduleItemsQuery(TeacherLeaveRequest $leave): Builder
    {
        return CourseScheduleItem::query()
            ->whereDate('date', $leave->date->toDateString())
            ->whereHas('course', fn ($q) => $q->where('teacher_id', $leave->teacher_id));
    }

    private function bookingsQuery(TeacherLeaveRequest $leave): Builder
    {
        return TeacherBooking::query()
            ->where('status', BookingStatus::Booked->value)
            ->whereHas('slot', fn ($q) => $q
                ->where('teacher_id', $leave->teacher_id)
                ->whereDate('starts_at', $leave->date->toDateString()));
    }

    private function openSlotsQuery(TeacherLeaveRequest $leave): Builder
    {
        return TeacherSlot::query()
            ->where('teacher_id', $leave->teacher_id)
            ->where('status', SlotStatus::Open->value)
            ->whereDate('starts_at', $leave->date->toDateString());
    }

    private function courseLearners(string $courseId): array
    {
        return CourseEnrollment::query()
            ->where('course_id', $courseId)
            ->with('profile.account:id,full_name,email,phone_number')
            ->get()
            ->map(fn (CourseEnrollment $enrollment): array => [
                'profile_id' => $enrollment->profile?->id,
                'full_name' => $enrollment->profile?->account?->full_name ?? $enrollment->profile?->nickname,
                'email' => $enrollment->profile?->account?->email,
                'phone_number' => $enrollment->profile?->account?->phone_number,
            ])
            ->all();
    }

    private function bookingCoinsPaid(TeacherBooking $booking): int
    {
        $delta = CoinTransaction::query()
            ->where('source_type', CoinSourceType::TeacherBooking->value)
            ->where('source_id', $booking->id)
            ->where('type', CoinTransactionType::TeacherBooking)
            ->value('delta');

        return abs((int) $delta);
    }

    private function bookingRefunded(TeacherBooking $booking): bool
    {
        return CoinTransaction::query()
            ->where('source_type', CoinSourceType::TeacherBooking->value)
            ->where('source_id', $booking->id)
            ->where('type', CoinTransactionType::Refund)
            ->exists();
    }

    private function notifyStaffLeaveRequestCreated(TeacherLeaveRequest $leave, User $teacher): void
    {
        $teacherName = $teacher->full_name ?: $teacher->email;
        $date = $leave->date->setTimezone('Asia/Ho_Chi_Minh')->format('d/m/Y');

        User::query()
            ->whereIn('role', [Role::Staff->value, Role::Admin->value])
            ->whereNull('deactivated_at')
            ->get()
            ->each(fn (User $user) => $this->adminNotifications->push(
                user: $user,
                type: AdminNotificationType::TeacherLeaveRequestCreated,
                title: 'Giáo viên vừa gửi đơn nghỉ',
                body: "{$teacherName} xin nghỉ ngày {$date}. Vui lòng kiểm tra lịch bị ảnh hưởng.",
                iconKey: IconKey::Calendar,
                payload: [
                    'leave_request_id' => $leave->id,
                    'teacher_id' => $teacher->id,
                    'route' => '/leave-requests',
                ],
                dedupKey: "teacher_leave_request:{$leave->id}:created:{$user->id}",
            ));
    }
}
