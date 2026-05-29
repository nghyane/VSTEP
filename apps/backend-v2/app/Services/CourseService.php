<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\AdminNotificationType;
use App\Enums\BookingStatus;
use App\Enums\CoinTransactionType;
use App\Enums\ExamSessionStatus;
use App\Enums\IconKey;
use App\Enums\NotificationType;
use App\Enums\Role;
use App\Enums\SlotStatus;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\ExamSession;
use App\Models\Profile;
use App\Models\TeacherBooking;
use App\Models\TeacherSlot;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class CourseService
{
    /** Fallback xu/booking khi course chưa set (chỉ áp khi DB column null, mặc định DB = 50). */
    public const BOOKING_COIN_COST_FALLBACK = 50;

    /** Phải đặt lịch trước ít nhất N giờ so với giờ bắt đầu slot. */
    public const BOOKING_LEAD_TIME_HOURS = 24;

    /** Booking page slot grid: 1 tuần đã qua + 4 tuần tới. */
    private const BOOKING_GRID_PAST_DAYS = 7;

    private const BOOKING_GRID_FUTURE_DAYS = 35;

    public function __construct(
        private readonly WalletService $walletService,
        private readonly NotificationService $notificationService,
        private readonly AdminNotificationService $adminNotificationService,
        private readonly ProgressService $progressService,
    ) {}

    /** @return Collection<int,Course> */
    public function listPublished(): Collection
    {
        return Course::query()
            ->with('teacher:id,full_name')
            ->withCount([
                'enrollments as sold_slots',
                'scheduleItems as schedule_items_count',
            ])
            ->where('is_published', true)
            ->orderBy('start_date')
            ->get();
    }

    /**
     * Bundle list response cho FE: courses + enrolled_course_ids + enrollments map
     * (next_session + commitment per khóa đã ghi danh).
     *
     * `enrollments` luôn trả stdClass để FE có shape `Record<courseId, {...}>` ổn định:
     * khi không có khóa nào, PHP empty array serialize thành `[]` thay vì `{}`.
     *
     * Bảo mật: `livestream_url` chỉ được expose cho khóa user đã ghi danh — đây là core asset
     * của khóa học, người chưa mua không được thấy.
     *
     * @return array{data: Collection<int,Course>, enrolled_course_ids: list<string>, enrollments: \stdClass}
     */
    public function listForProfile(?Profile $profile): array
    {
        if (! $profile) {
            $courses = $this->listPublished();
            $courses->each(fn (Course $c) => $c->makeHidden('livestream_url'));

            return [
                'data' => $courses,
                'enrolled_course_ids' => [],
                'enrollments' => new \stdClass,
            ];
        }

        // Học viên đã ghi danh phải thấy khóa của họ kể cả khi admin tạm đóng
        // ghi danh (toggle is_published=false). Đóng ghi danh = chặn người
        // mới mua, không phải xóa course khỏi "Khóa của tôi".
        $enrolledIds = CourseEnrollment::query()
            ->where('profile_id', $profile->id)
            ->pluck('course_id');

        $courses = Course::query()
            ->with('teacher:id,full_name')
            ->withCount([
                'enrollments as sold_slots',
                'scheduleItems as schedule_items_count',
            ])
            ->where(function ($q) use ($enrolledIds) {
                $q->where('is_published', true);
                if ($enrolledIds->isNotEmpty()) {
                    $q->orWhereIn('id', $enrolledIds);
                }
            })
            ->orderBy('start_date')
            ->get();

        // Sau filter union ở trên, $enrolledIds có thể chứa course không nằm
        // trong $courses (vd profile có nhiều enrollment cũ với khóa đã xóa).
        // Intersect lại để FE chỉ thấy id thuộc list trả về.
        $courseIdSet = $courses->pluck('id')->flip();
        $enrolledIds = $enrolledIds->filter(fn ($id) => $courseIdSet->has($id))->values();
        $enrolledSet = $enrolledIds->flip();
        $enrollments = new \stdClass;
        foreach ($courses as $course) {
            if (! $enrolledSet->has($course->id)) {
                $course->makeHidden('livestream_url');

                continue;
            }
            $enrollments->{$course->id} = [
                'next_session' => $this->nextSession($course),
                'commitment' => $this->commitmentStatus($profile, $course),
            ];
        }

        return [
            'data' => $courses,
            'enrolled_course_ids' => $enrolledIds->values()->all(),
            'enrollments' => $enrollments,
        ];
    }

    public function getDetail(string $id): Course
    {
        /** @var Course $course */
        $course = Course::query()
            ->with(['scheduleItems', 'enrollments', 'teacher:id,full_name,title,bio'])
            ->findOrFail($id);

        return $course;
    }

    /**
     * Create enrollment — single source of truth for both learner and admin flows.
     *
     * Guards: duplicate check + capacity check (with row lock to prevent races).
     * Callers decide whether to credit bonus coins and provide optional metadata.
     *
     * Must be called inside a DB::transaction by the caller (CourseOrderService or AdminCourseService).
     */
    public function createEnrollment(
        Profile $profile,
        Course $course,
        bool $creditBonus = true,
        ?string $commitmentSignature = null,
        ?string $notiTitle = null,
        ?string $notiBody = null,
    ): CourseEnrollment {
        $locked = Course::query()->whereKey($course->id)->lockForUpdate()->first();
        if ($locked === null) {
            throw new \RuntimeException('Course not found during enroll.');
        }

        if (CourseEnrollment::query()
            ->where('course_id', $locked->id)
            ->where('profile_id', $profile->id)
            ->exists()
        ) {
            throw ValidationException::withMessages([
                'course' => ['Bạn đã ghi danh khóa học này.'],
            ]);
        }

        if ($locked->soldSlots() >= $locked->max_slots) {
            throw ValidationException::withMessages([
                'course' => ['Khóa học đã đủ số học viên tối đa.'],
            ]);
        }

        $bonusCoins = $creditBonus ? (int) $locked->bonus_coins : 0;

        $enrollment = CourseEnrollment::create([
            'profile_id' => $profile->id,
            'course_id' => $locked->id,
            'enrolled_at' => now(),
            'coins_paid' => 0,
            'bonus_coins_received' => $bonusCoins,
            'commitment_signature' => $commitmentSignature,
        ]);

        if ($bonusCoins > 0) {
            $this->walletService->credit(
                $profile,
                $bonusCoins,
                CoinTransactionType::CourseBonus,
                $enrollment,
                ['reason' => 'course_bonus'],
            );
        }

        $title = $notiTitle ?? 'Ghi danh thành công';
        $body = $notiBody ?? "Bạn đã tham gia khóa {$locked->title}.";
        DB::afterCommit(fn () => $this->notificationService->push(
            profile: $profile,
            type: NotificationType::CourseEnrolled,
            title: $title,
            body: $body,
            iconKey: IconKey::Book,
            dedupKey: "course_enroll:{$locked->id}:{$profile->id}",
        ));

        return $enrollment;
    }

    /**
     * Commitment status: pending / met / violated based on full tests in window.
     *
     * Phases:
     *  - not_enrolled: chưa ghi danh
     *  - met: đã đủ required full tests trong window
     *  - violated: now > windowEnd nhưng chưa đủ → khóa cam kết bị vi phạm
     *  - pending: còn trong window và chưa đủ
     *
     * @return array{phase: string, completed: int, required: int, window_start_at: ?string, deadline_at: ?string}
     */
    public function commitmentStatus(Profile $profile, Course $course): array
    {
        $enrollment = CourseEnrollment::query()
            ->where('profile_id', $profile->id)
            ->where('course_id', $course->id)
            ->first();

        if (! $enrollment) {
            return [
                'phase' => 'not_enrolled',
                'completed' => 0,
                'required' => $course->required_full_tests,
                'window_start_at' => null,
                'deadline_at' => null,
            ];
        }

        $windowStart = $enrollment->enrolled_at->copy();
        $windowEnd = $windowStart->copy()->addDays($course->commitment_window_days);

        $completed = ExamSession::query()
            ->where('profile_id', $profile->id)
            ->where('is_full_test', true)
            ->whereIn('status', ExamSessionStatus::terminalValues())
            ->whereBetween('submitted_at', [$windowStart, $windowEnd])
            ->count();

        $phase = match (true) {
            $completed >= $course->required_full_tests => 'met',
            now()->gt($windowEnd) => 'violated',
            default => 'pending',
        };

        return [
            'phase' => $phase,
            'completed' => $completed,
            'required' => $course->required_full_tests,
            'window_start_at' => $windowStart->toIso8601String(),
            'deadline_at' => $windowEnd->toIso8601String(),
        ];
    }

    /**
     * Next upcoming session (date >= today). Null nếu hết lịch.
     *
     * @return array{id: string, session_number: int, date: string, start_time: string, end_time: string, topic: string}|null
     */
    public function nextSession(Course $course): ?array
    {
        $today = now()->startOfDay()->toDateString();
        $session = $course->scheduleItems()
            ->where('date', '>=', $today)
            ->orderBy('date')
            ->orderBy('start_time')
            ->first();

        if (! $session) {
            return null;
        }

        return [
            'id' => $session->id,
            'session_number' => $session->session_number,
            'date' => $session->date->toDateString(),
            'start_time' => $session->start_time,
            'end_time' => $session->end_time,
            'topic' => $session->topic,
        ];
    }

    /**
     * Book teacher slot. Gate: enrolled + commitment met + slot limit.
     */
    public function bookSlot(
        Profile $profile,
        Course $course,
        TeacherSlot $slot,
        ?string $submissionType = null,
        ?string $submissionId = null,
    ): TeacherBooking {
        if ($slot->course_id !== $course->id) {
            throw ValidationException::withMessages(['slot' => ['Slot không thuộc khóa học này.']]);
        }
        if ($slot->starts_at->isPast()) {
            throw ValidationException::withMessages(['slot' => ['Slot đã qua.']]);
        }
        if ($slot->starts_at->lt(now()->addHours(self::BOOKING_LEAD_TIME_HOURS))) {
            $hours = self::BOOKING_LEAD_TIME_HOURS;
            throw ValidationException::withMessages(['slot' => ["Cần đặt lịch trước ít nhất {$hours} giờ so với giờ bắt đầu slot."]]);
        }
        if ($slot->starts_at->lt($course->start_date->startOfDay())) {
            throw ValidationException::withMessages(['slot' => ['Slot nằm trước ngày bắt đầu khóa học.']]);
        }

        $commitment = $this->commitmentStatus($profile, $course);
        if ($commitment['phase'] !== 'met') {
            throw ValidationException::withMessages(['commitment' => ['Chưa hoàn thành cam kết. Vui lòng hoàn thành đủ số đề thi yêu cầu trước.']]);
        }

        $bookedCount = TeacherBooking::query()
            ->where('profile_id', $profile->id)
            ->whereHas('slot', fn ($q) => $q->where('course_id', $course->id))
            ->whereIn('status', BookingStatus::activeValues())
            ->count();

        if ($bookedCount >= $course->max_slots_per_student) {
            throw ValidationException::withMessages(['slots' => ['Đã đạt giới hạn đăng ký slot tối đa.']]);
        }

        $cost = (int) ($course->booking_coin_cost ?? self::BOOKING_COIN_COST_FALLBACK);

        return DB::transaction(function () use ($profile, $slot, $submissionType, $submissionId, $cost) {
            $locked = TeacherSlot::query()->whereKey($slot->id)->lockForUpdate()->first();
            if ($locked->status !== SlotStatus::Open) {
                throw ValidationException::withMessages(['slot' => ['Slot không còn khả dụng.']]);
            }

            $locked->update(['status' => SlotStatus::Booked]);

            $booking = TeacherBooking::create([
                'slot_id' => $slot->id,
                'profile_id' => $profile->id,
                'submission_type' => $submissionType,
                'submission_id' => $submissionId,
                'meet_url' => null,
                'status' => BookingStatus::Booked,
                'booked_at' => now(),
            ]);

            // Trừ xu sau khi tạo booking để source_id reference được booking record.
            $this->walletService->spend(
                $profile,
                $cost,
                CoinTransactionType::TeacherBooking,
                $booking,
                ['slot_id' => $slot->id, 'course_id' => $slot->course_id],
            );

            DB::afterCommit(fn () => $this->notificationService->push(
                profile: $profile,
                type: NotificationType::BookingCreated,
                title: 'Đặt lịch thành công',
                body: 'Lịch hẹn đã được xác nhận. Link phòng học sẽ được giảng viên cập nhật trước buổi học.',
                iconKey: IconKey::Calendar,
                dedupKey: "booking:{$booking->id}",
            ));

            // Notify teacher to add meet link.
            DB::afterCommit(function () use ($slot, $profile, $booking) {
                $learnerName = $profile->nickname ?? $profile->account?->full_name ?? 'Học viên';
                $course = $slot->course;
                $courseName = $course?->title ?? 'Khóa học';

                $teacher = $course?->teacher;
                if ($teacher === null) {
                    $teacher = User::find($slot->teacher_id);
                }
                if ($teacher !== null) {
                    $this->adminNotificationService->push(
                        user: $teacher,
                        type: AdminNotificationType::BookingCreated,
                        title: 'Có học viên đặt lịch 1-1',
                        body: "{$learnerName} đã đặt slot {$slot->starts_at->setTimezone('Asia/Ho_Chi_Minh')->format('H:i d/m/Y')} — {$courseName}. Vui lòng thêm link Google Meet.",
                        iconKey: IconKey::Calendar,
                        payload: ['booking_id' => $booking->id, 'course_id' => $slot->course_id],
                        dedupKey: "teacher_booking:{$booking->id}",
                    );
                }

                // Notify all admins about new booking.
                $admins = User::where('role', Role::Admin)->get();
                $teacherName = $teacher?->full_name ?? 'giáo viên';
                foreach ($admins as $admin) {
                    $this->adminNotificationService->push(
                        user: $admin,
                        type: AdminNotificationType::BookingCreated,
                        title: 'Booking 1-1 mới',
                        body: "{$learnerName} đặt slot {$slot->starts_at->setTimezone('Asia/Ho_Chi_Minh')->format('H:i d/m/Y')} với {$teacherName} — {$courseName}.",
                        iconKey: IconKey::Calendar,
                        payload: ['booking_id' => $booking->id, 'course_id' => $slot->course_id],
                        dedupKey: "admin_booking:{$booking->id}:{$admin->id}",
                    );
                }
            });

            return $booking;
        });
    }

    /**
     * Booking page payload cho FE (`BookingPageData`):
     *  - teacher: thông tin giáo viên (id, full_name, title, bio)
     *  - slots: tất cả slot trong cửa sổ hiển thị (-7d…+35d) + status đã suy luận theo profile hiện tại
     *  - my_bookings_count: số booking active của profile cho course này
     *
     * Status mapping per slot:
     *  - past: starts_at < now (bất kể status DB)
     *  - booked_me: profile có TeacherBooking active trên slot
     *  - booked_other: slot.status = 'booked' và không phải của profile
     *  - available: slot.status = 'open'
     *
     * @return array{
     *     teacher: array{id: string, full_name: string, title: ?string, bio: ?string},
     *     slots: list<array{id: string, starts_at: string, duration_minutes: int, status: string, meet_url: ?string}>,
     *     my_bookings_count: int,
     *     max_bookings_per_student: int,
     *     commitment: array{phase: string, completed: int, required: int, window_start_at: ?string, deadline_at: ?string},
     * }
     */
    public function getBookingPageData(Profile $profile, Course $course): array
    {
        $course->loadMissing('teacher:id,full_name,title,bio');

        $now = now();
        $windowStart = $now->copy()->subDays(self::BOOKING_GRID_PAST_DAYS)->startOfDay();
        $windowEnd = $now->copy()->addDays(self::BOOKING_GRID_FUTURE_DAYS)->endOfDay();
        // Student chỉ thấy slot từ ngày khóa bắt đầu trở đi.
        $courseStart = $course->start_date->startOfDay();
        if ($windowStart->lt($courseStart)) {
            $windowStart = $courseStart;
        }

        /** @var Collection<int,TeacherSlot> $slots */
        $slots = TeacherSlot::query()
            ->where('course_id', $course->id)
            ->whereBetween('starts_at', [$windowStart, $windowEnd])
            ->orderBy('starts_at')
            ->get();

        // Một query cho tất cả booking active của profile trong course
        // → vừa map vào slots, vừa derive my_bookings_count (không gọi COUNT thứ 2).
        $myBookings = TeacherBooking::query()
            ->where('profile_id', $profile->id)
            ->whereHas('slot', fn ($q) => $q->where('course_id', $course->id))
            ->whereIn('status', BookingStatus::activeValues())
            ->get()
            ->keyBy('slot_id');

        $items = $slots->map(function (TeacherSlot $slot) use ($myBookings, $now) {
            $mine = $myBookings->get($slot->id);
            $leadTimeCutoff = $now->copy()->addHours(self::BOOKING_LEAD_TIME_HOURS);
            $status = match (true) {
                $slot->starts_at->lt($now) => 'past',
                $mine !== null => 'booked_me',
                $slot->status === SlotStatus::Booked => 'booked_other',
                $slot->starts_at->lt($leadTimeCutoff) => 'past',
                default => 'available',
            };

            return [
                'id' => $slot->id,
                'starts_at' => $slot->starts_at->toIso8601String(),
                'duration_minutes' => (int) $slot->duration_minutes,
                'status' => $status,
                'meet_url' => $status === 'booked_me' ? $mine->meet_url : null,
            ];
        })->values()->all();

        $teacher = $course->teacher;

        return [
            'teacher' => [
                'id' => $teacher->id,
                'full_name' => $teacher->full_name,
                'title' => $teacher->title,
                'bio' => $teacher->bio,
            ],
            'slots' => $items,
            'my_bookings_count' => $myBookings->count(),
            'max_bookings_per_student' => (int) $course->max_slots_per_student,
            'booking_coin_cost' => (int) ($course->booking_coin_cost ?? self::BOOKING_COIN_COST_FALLBACK),
            'booking_lead_time_hours' => self::BOOKING_LEAD_TIME_HOURS,
            'commitment' => $this->commitmentStatus($profile, $course),
        ];
    }

    /**
     * Find enrolled members at risk of failing their target.
     *
     * Risk criteria (any one triggers flag):
     * - Average band < 5.0
     * - No exam activity in 7 days (streak = 0)
     * - Deadline within 14 days and current band < target
     *
     * @return list<array{profile_id: string, nickname: string, band: float|null, streak: int, days_to_deadline: int|null, target_level: string, risk_reasons: list<string>}>
     */
    public function atRiskMembers(Course $course): array
    {
        $enrollments = $course->enrollments()->with('profile:id,nickname,target_level,target_deadline')->get();
        $result = [];

        foreach ($enrollments as $enrollment) {
            $profile = $enrollment->profile;
            $overview = $this->progressService->getOverview($profile);
            $chart = $overview['chart'];
            $stats = $overview['stats'];

            $reasons = [];

            // Check band
            $avgBand = $this->avgBandFromChart($chart);
            if ($avgBand !== null && $avgBand < 5.0) {
                $reasons[] = 'Điểm trung bình thấp ('.number_format($avgBand, 1).')';
            }

            // Check streak
            if ($stats['streak'] === 0) {
                $reasons[] = 'Không luyện tập trong 7 ngày';
            }

            // Check deadline
            $daysToDeadline = $overview['profile']['days_until_exam'];
            if ($daysToDeadline !== null && $daysToDeadline <= 14 && $avgBand !== null) {
                $targetBand = match ($profile->target_level) {
                    'C1' => 8.5,
                    'B2' => 6.0,
                    default => 4.0,
                };
                if ($avgBand < $targetBand) {
                    $reasons[] = "Còn {$daysToDeadline} ngày, chưa đạt mục tiêu {$profile->target_level}";
                }
            }

            if ($reasons !== []) {
                $result[] = [
                    'profile_id' => $profile->id,
                    'nickname' => $profile->nickname,
                    'band' => $avgBand,
                    'streak' => $stats['streak'],
                    'days_to_deadline' => $daysToDeadline,
                    'target_level' => $profile->target_level,
                    'risk_reasons' => $reasons,
                ];
            }
        }

        return $result;
    }

    /** @param  array<string, float|int|null>|null  $chart */
    private function avgBandFromChart(?array $chart): ?float
    {
        if ($chart === null) {
            return null;
        }

        $bands = array_filter([
            $chart['listening'] ?? null,
            $chart['reading'] ?? null,
            $chart['writing'] ?? null,
            $chart['speaking'] ?? null,
        ], fn ($v) => $v !== null);

        if ($bands === []) {
            return null;
        }

        return round(array_sum($bands) / count($bands), 1);
    }
}
