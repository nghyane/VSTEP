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

    public function getDetail(string $id): Course
    {
        /** @var Course $course */
        $course = Course::query()->with(['scheduleItems', 'enrollments', 'teacher:id,full_name'])->findOrFail($id);

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
     * Commitment status: pending/met based on full tests in window.
     *
     * @return array{phase: string, completed: int, required: int}
     */
    public function commitmentStatus(Profile $profile, Course $course): array
    {
        $enrollment = CourseEnrollment::query()
            ->where('profile_id', $profile->id)
            ->where('course_id', $course->id)
            ->first();

        if (! $enrollment) {
            return ['phase' => 'not_enrolled', 'completed' => 0, 'required' => $course->required_full_tests];
        }

        $windowStart = $enrollment->enrolled_at->copy()->addDays($course->exam_cooldown_days);
        $windowEnd = $windowStart->copy()->addDays($course->commitment_window_days);

        $completed = ExamSession::query()
            ->where('profile_id', $profile->id)
            ->where('is_full_test', true)
            ->where('status', 'submitted')
            ->whereBetween('submitted_at', [$windowStart, $windowEnd])
            ->count();

        return [
            'phase' => $completed >= $course->required_full_tests ? 'met' : 'pending',
            'completed' => $completed,
            'required' => $course->required_full_tests,
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
                'status' => 'booked',
                'booked_at' => now(),
            ]);

            DB::afterCommit(fn () => $this->notificationService->push(
                profile: $profile,
                type: 'booking_created',
                title: 'Đặt lịch thành công',
                body: 'Lịch hẹn đã được xác nhận. Chờ giáo viên gửi link meeting.',
                iconKey: 'calendar',
                dedupKey: "booking:{$booking->id}",
            ));

            return $booking;
        });
    }
}
