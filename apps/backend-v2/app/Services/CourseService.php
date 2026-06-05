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
use App\Models\ExamSpeakingSubmission;
use App\Models\ExamWritingSubmission;
use App\Models\Profile;
use App\Models\TeacherBooking;
use App\Models\TeacherSlot;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

final class CourseService
{
    public const BOOKING_COIN_COST_FALLBACK = 50;

    public const BOOKING_LEAD_TIME_HOURS = 24;

    private const BOOKING_GRID_PAST_DAYS = 7;

    private const BOOKING_GRID_FUTURE_DAYS = 35;

    public function __construct(
        private readonly WalletService $walletService,
        private readonly NotificationService $notificationService,
        private readonly AdminNotificationService $adminNotificationService,
        private readonly NotificationEmailService $emailService,
        private readonly ProgressService $progressService,
    ) {}

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
        DB::afterCommit(function () use ($profile, $locked, $title, $body): void {
            $notification = $this->notificationService->push(
                profile: $profile,
                type: NotificationType::CourseEnrolled,
                title: $title,
                body: $body,
                iconKey: IconKey::Book,
                dedupKey: "course_enroll:{$locked->id}:{$profile->id}",
            );

            if ($notification !== null) {
                try {
                    $this->emailService->sendCourseEnrolled(
                        $profile,
                        $title,
                        $body,
                        $locked->id,
                    );
                } catch (\Throwable $e) {
                    Log::error('Failed to send course enrollment notification email', [
                        'course_id' => $locked->id,
                        'profile_id' => $profile->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        });

        return $enrollment;
    }

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

            $this->walletService->spend(
                $profile,
                $cost,
                CoinTransactionType::TeacherBooking,
                $booking,
                ['slot_id' => $slot->id, 'course_id' => $slot->course_id],
            );

            DB::afterCommit(function () use ($profile, $slot, $booking): void {
                $notification = $this->notificationService->push(
                    profile: $profile,
                    type: NotificationType::BookingCreated,
                    title: 'Đặt lịch thành công',
                    body: 'Lịch hẹn đã được xác nhận. Link phòng học sẽ được giảng viên cập nhật trước buổi học.',
                    iconKey: IconKey::Calendar,
                    dedupKey: "booking:{$booking->id}",
                );

                if ($notification !== null) {
                    $this->emailService->sendLearnerBookingCreated($profile, $slot);
                }
            });

            DB::afterCommit(function () use ($slot, $profile, $booking) {
                $learnerName = $profile->nickname ?? $profile->account?->full_name ?? 'Học viên';
                $course = $slot->course;
                $courseName = $course?->title ?? 'Khóa học';
                $startsAt = $slot->starts_at->setTimezone('Asia/Ho_Chi_Minh')->format('H:i d/m/Y');

                $teacher = $course?->teacher;
                if ($teacher === null) {
                    $teacher = User::find($slot->teacher_id);
                }
                if ($teacher !== null) {
                    $notification = $this->adminNotificationService->push(
                        user: $teacher,
                        type: AdminNotificationType::BookingCreated,
                        title: 'Có học viên đặt lịch 1-1',
                        body: "{$learnerName} đã đặt slot {$startsAt} — {$courseName}. Vui lòng thêm link Google Meet.",
                        iconKey: IconKey::Calendar,
                        payload: ['booking_id' => $booking->id, 'course_id' => $slot->course_id],
                        dedupKey: "teacher_booking:{$booking->id}",
                    );

                    if ($notification !== null) {
                        $this->emailService->sendTeacherBookingCreated($teacher, $learnerName, $courseName, $startsAt);
                    }
                }

                $admins = User::where('role', Role::Admin)->get();
                $teacherName = $teacher?->full_name ?? 'giáo viên';
                foreach ($admins as $admin) {
                    $notification = $this->adminNotificationService->push(
                        user: $admin,
                        type: AdminNotificationType::BookingCreated,
                        title: 'Booking 1-1 mới',
                        body: "{$learnerName} đặt slot {$startsAt} với {$teacherName} — {$courseName}.",
                        iconKey: IconKey::Calendar,
                        payload: ['booking_id' => $booking->id, 'course_id' => $slot->course_id],
                        dedupKey: "admin_booking:{$booking->id}:{$admin->id}",
                    );

                    if ($notification !== null) {
                        $this->emailService->sendAdminBookingCreated($admin, $learnerName, $teacherName, $courseName, $startsAt);
                    }
                }
            });

            return $booking;
        });
    }

    public function getBookingPageData(Profile $profile, Course $course): array
    {
        $course->loadMissing('teacher:id,full_name,title,bio');

        $now = now();
        $windowStart = $now->copy()->subDays(self::BOOKING_GRID_PAST_DAYS)->startOfDay();
        $windowEnd = $now->copy()->addDays(self::BOOKING_GRID_FUTURE_DAYS)->endOfDay();
        $courseStart = $course->start_date->startOfDay();
        if ($windowStart->lt($courseStart)) {
            $windowStart = $courseStart;
        }

        $slots = TeacherSlot::query()
            ->where('course_id', $course->id)
            ->whereBetween('starts_at', [$windowStart, $windowEnd])
            ->orderBy('starts_at')
            ->get();

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

    public function predictAtRiskLearners(Course $course): array
    {
        $enrollments = $course->enrollments()->with('profile:id,nickname,target_level,target_deadline')->get();
        $result = [];

        foreach ($enrollments as $enrollment) {
            $profile = $enrollment->profile;
            $overview = $this->progressService->getOverview($profile);
            $chart = $overview['scores']['spider'];
            $streak = $overview['streak']['current'];

            $reasons = [];

            $avgBand = $this->avgBandFromChart($chart);

            $trend = $this->trendDirection($profile);

            if ($avgBand !== null && $avgBand < 5.0) {
                $reasons[] = 'Điểm trung bình thấp ('.number_format($avgBand, 1).')';
            }

            if ($streak === 0) {
                $reasons[] = 'Không luyện tập trong 7 ngày';
            }

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
                    'trend' => $trend,
                    'streak' => $streak,
                    'days_to_deadline' => $daysToDeadline,
                    'target_level' => $profile->target_level,
                    'risk_reasons' => $reasons,
                ];
            }
        }

        return $result;
    }

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

    private function trendDirection(Profile $profile): string
    {
        $sessions = ExamSession::query()
            ->where('profile_id', $profile->id)
            ->whereIn('mode', ['custom', 'full'])
            ->whereIn('status', ExamSessionStatus::terminalValues())
            ->orderByDesc('submitted_at')
            ->limit(3)
            ->pluck('id');

        if ($sessions->count() < 2) {
            return 'insufficient_data';
        }

        $bandPerSession = [];
        foreach ($sessions as $sid) {
            $band = $this->sessionAvgBand($sid);
            if ($band !== null) {
                $bandPerSession[] = $band;
            }
        }

        if (count($bandPerSession) < 2) {
            return 'insufficient_data';
        }

        $latest = $bandPerSession[0];
        $prevAvg = array_sum(array_slice($bandPerSession, 1)) / count(array_slice($bandPerSession, 1));

        if ($latest > $prevAvg + 0.3) {
            return 'improving';
        }
        if ($latest < $prevAvg - 0.3) {
            return 'declining';
        }

        return 'stable';
    }

    private function sessionAvgBand(string $sessionId): ?float
    {
        $bands = [];

        $writingBands = ExamWritingSubmission::query()
            ->with('assessmentAttempt.result')
            ->where('session_id', $sessionId)
            ->get()
            ->map(fn (ExamWritingSubmission $submission): ?float => $submission->assessmentAttempt?->result?->overall_band)
            ->filter(fn (?float $band): bool => $band !== null);
        if ($writingBands->isNotEmpty()) {
            $bands[] = (float) $writingBands->avg();
        }

        $speakingBands = ExamSpeakingSubmission::query()
            ->with('assessmentAttempt.result')
            ->where('session_id', $sessionId)
            ->get()
            ->map(fn (ExamSpeakingSubmission $submission): ?float => $submission->assessmentAttempt?->result?->overall_band)
            ->filter(fn (?float $band): bool => $band !== null);
        if ($speakingBands->isNotEmpty()) {
            $bands[] = (float) $speakingBands->avg();
        }

        $listeningAnswers = DB::table('exam_mcq_answers')
            ->join('exam_listening_items', 'exam_mcq_answers.content_ref_id', '=', 'exam_listening_items.id')
            ->where('exam_mcq_answers.session_id', $sessionId)
            ->where('exam_mcq_answers.content_ref_type', 'exam_listening_item')
            ->whereNotNull('exam_mcq_answers.selected_index')
            ->selectRaw('exam_mcq_answers.selected_index = exam_listening_items.correct_index as correct')
            ->pluck('correct');
        if ($listeningAnswers->isNotEmpty()) {
            $bands[] = ($listeningAnswers->filter(fn ($c) => $c)->count() / $listeningAnswers->count()) * 10;
        }

        $readingAnswers = DB::table('exam_mcq_answers')
            ->join('exam_reading_items', 'exam_mcq_answers.content_ref_id', '=', 'exam_reading_items.id')
            ->where('exam_mcq_answers.session_id', $sessionId)
            ->where('exam_mcq_answers.content_ref_type', 'exam_reading_item')
            ->whereNotNull('exam_mcq_answers.selected_index')
            ->selectRaw('exam_mcq_answers.selected_index = exam_reading_items.correct_index as correct')
            ->pluck('correct');
        if ($readingAnswers->isNotEmpty()) {
            $bands[] = ($readingAnswers->filter(fn ($c) => $c)->count() / $readingAnswers->count()) * 10;
        }

        if ($bands === []) {
            return null;
        }

        return round(array_sum($bands) / count($bands), 1);
    }
}
