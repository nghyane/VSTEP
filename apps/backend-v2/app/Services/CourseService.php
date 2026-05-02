<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CoinTransactionType;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\ExamSession;
use App\Models\Profile;
use App\Models\TeacherBooking;
use App\Models\TeacherSlot;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CourseService
{
    /** Coin price per 30-min 1-1 booking. Mirrors FE BOOKING_COIN_COST. */
    public const BOOKING_COIN_COST = 50;

    /** Booking page slot grid: 1 tuần đã qua + 4 tuần tới. */
    private const BOOKING_GRID_PAST_DAYS = 7;

    private const BOOKING_GRID_FUTURE_DAYS = 35;

    public function __construct(
        private readonly WalletService $walletService,
        private readonly NotificationService $notificationService,
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
        $courses = $this->listPublished();

        if (! $profile) {
            $courses->each(fn (Course $c) => $c->makeHidden('livestream_url'));

            return [
                'data' => $courses,
                'enrolled_course_ids' => [],
                'enrollments' => new \stdClass,
            ];
        }

        $enrolledIds = CourseEnrollment::query()
            ->where('profile_id', $profile->id)
            ->whereIn('course_id', $courses->pluck('id'))
            ->pluck('course_id');

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
     * Enroll profile in course. Payment is VND (external). Credit bonus coins.
     */
    public function enroll(Profile $profile, Course $course): CourseEnrollment
    {
        if ($course->end_date->isPast()) {
            throw ValidationException::withMessages(['course' => ['Khóa học đã kết thúc.']]);
        }
        if ($course->isFull()) {
            throw ValidationException::withMessages(['course' => ['Khóa học đã đủ học viên.']]);
        }
        if (CourseEnrollment::query()->where('profile_id', $profile->id)->where('course_id', $course->id)->exists()) {
            throw ValidationException::withMessages(['course' => ['Bạn đã ghi danh khóa học này.']]);
        }

        return DB::transaction(function () use ($profile, $course) {
            $enrollment = CourseEnrollment::create([
                'profile_id' => $profile->id,
                'course_id' => $course->id,
                'enrolled_at' => now(),
                'coins_paid' => 0,
                'bonus_coins_received' => $course->bonus_coins,
            ]);

            if ($course->bonus_coins > 0) {
                $this->walletService->credit($profile, $course->bonus_coins, CoinTransactionType::OnboardingBonus, $enrollment, ['reason' => 'course_bonus']);
            }

            DB::afterCommit(fn () => $this->notificationService->push(
                profile: $profile,
                type: 'course_enrolled',
                title: 'Ghi danh thành công',
                body: "Bạn đã tham gia khóa {$course->title}.",
                iconKey: 'book',
                dedupKey: "course_enroll:{$course->id}:{$profile->id}",
            ));

            return $enrollment;
        });
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
            ->where('status', 'submitted')
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

        $commitment = $this->commitmentStatus($profile, $course);
        if ($commitment['phase'] !== 'met') {
            throw ValidationException::withMessages(['commitment' => ['Chưa hoàn thành cam kết. Vui lòng hoàn thành đủ số đề thi yêu cầu trước.']]);
        }

        $bookedCount = TeacherBooking::query()
            ->where('profile_id', $profile->id)
            ->whereHas('slot', fn ($q) => $q->where('course_id', $course->id))
            ->whereIn('status', ['booked', 'completed'])
            ->count();

        if ($bookedCount >= $course->max_slots_per_student) {
            throw ValidationException::withMessages(['slots' => ['Đã đạt giới hạn đăng ký slot tối đa.']]);
        }

        return DB::transaction(function () use ($profile, $slot, $submissionType, $submissionId) {
            $locked = TeacherSlot::query()->whereKey($slot->id)->lockForUpdate()->first();
            if ($locked->status !== 'open') {
                throw ValidationException::withMessages(['slot' => ['Slot không còn khả dụng.']]);
            }

            $locked->update(['status' => 'booked']);

            $booking = TeacherBooking::create([
                'slot_id' => $slot->id,
                'profile_id' => $profile->id,
                'submission_type' => $submissionType,
                'submission_id' => $submissionId,
                'meet_url' => $this->generateMeetUrl(),
                'status' => 'booked',
                'booked_at' => now(),
            ]);

            // Trừ xu sau khi tạo booking để source_id reference được booking record.
            $this->walletService->spend(
                $profile,
                self::BOOKING_COIN_COST,
                CoinTransactionType::TeacherBooking,
                $booking,
                ['slot_id' => $slot->id, 'course_id' => $slot->course_id],
            );

            DB::afterCommit(fn () => $this->notificationService->push(
                profile: $profile,
                type: 'booking_created',
                title: 'Đặt lịch thành công',
                body: 'Lịch hẹn đã được xác nhận. Link meeting đã sẵn sàng trong chi tiết booking.',
                iconKey: 'calendar',
                dedupKey: "booking:{$booking->id}",
            ));

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
            ->whereIn('status', ['booked', 'completed'])
            ->get()
            ->keyBy('slot_id');

        $items = $slots->map(function (TeacherSlot $slot) use ($myBookings, $now) {
            $mine = $myBookings->get($slot->id);
            $status = match (true) {
                $slot->starts_at->lt($now) => 'past',
                $mine !== null => 'booked_me',
                $slot->status === 'booked' => 'booked_other',
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
            'commitment' => $this->commitmentStatus($profile, $course),
        ];
    }

    /**
     * Mock Google Meet URL. Production: teacher tự cập nhật qua PATCH /teacher/bookings/{id}.
     * Định dạng `aaa-bbbb-ccc` (lowercase a-z) khớp với Meet thật để FE render link nhất quán.
     */
    private function generateMeetUrl(): string
    {
        $alphabet = 'abcdefghijklmnopqrstuvwxyz';
        $pick = function (int $len) use ($alphabet): string {
            $out = '';
            $max = strlen($alphabet) - 1;
            for ($i = 0; $i < $len; $i++) {
                $out .= $alphabet[random_int(0, $max)];
            }

            return $out;
        };

        return 'https://meet.google.com/'.$pick(3).'-'.$pick(4).'-'.$pick(3);
    }
}
