<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseEnrollmentOrder;
use App\Models\CourseScheduleItem;
use App\Models\Profile;
use App\Models\TeacherBooking;
use App\Models\TeacherSlot;
use App\Services\Admin\Course\Contracts\AdminCourseBookingInterface;
use App\Services\Admin\Course\Contracts\AdminCourseEnrollmentInterface;
use App\Services\Admin\Course\Contracts\AdminCourseScheduleInterface;
use App\Services\CourseService;
use App\Services\NotificationService;
use App\Services\WalletService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class AdminCourseService
{
    public function __construct(
        private readonly CourseService $courseService,
        private readonly NotificationService $notificationService,
        private readonly WalletService $walletService,
        private readonly AdminCourseBookingInterface $booking,
        private readonly AdminCourseEnrollmentInterface $enrollment,
        private readonly AdminCourseScheduleInterface $schedule,
    ) {}

    /**
     * @param  array<string,mixed>  $filters
     */
    public function list(array $filters): Builder
    {
        $query = Course::query()
            ->with('teacher:id,full_name,email')
            ->withCount(['enrollments', 'scheduleItems']);

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function (Builder $b) use ($term) {
                $b->where('title', 'ilike', $term)->orWhere('slug', 'ilike', $term);
            });
        }

        if (array_key_exists('is_published', $filters) && $filters['is_published'] !== null) {
            $query->where('is_published', (bool) $filters['is_published']);
        }

        if (! empty($filters['target_level'])) {
            $query->where('target_level', $filters['target_level']);
        }

        if (! empty($filters['teacher_id'])) {
            $query->where('teacher_id', $filters['teacher_id']);
        }

        return $query->orderByDesc('created_at');
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function create(array $data): Course
    {
        if (! array_key_exists('is_published', $data)) {
            $data['is_published'] = false;
        }
        if (! array_key_exists('bonus_coins', $data)) {
            $data['bonus_coins'] = 0;
        }
        if (! array_key_exists('price_coins', $data) || $data['price_coins'] === null) {
            // Legacy field — admin không nhập, mặc định 0.
            $data['price_coins'] = 0;
        }
        if (! array_key_exists('max_slots_per_student', $data)) {
            $data['max_slots_per_student'] = 2;
        }
        if (! array_key_exists('booking_coin_cost', $data) || $data['booking_coin_cost'] === null) {
            $data['booking_coin_cost'] = 50;
        }

        return Course::create($data);
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function update(Course $course, array $data): Course
    {
        $course->fill($data)->save();

        return $course->fresh(['teacher']);
    }

    public function delete(Course $course): void
    {
        // FK enrollments + enrollment_orders đều RESTRICT — chặn xóa khi còn ghi danh hoặc
        // đơn mua đang treo, tránh DB throw 500 leak ra response.
        if ($course->enrollments()->exists()) {
            throw ValidationException::withMessages([
                'course' => ['Không thể xóa khóa học đã có học viên ghi danh.'],
            ]);
        }
        if (CourseEnrollmentOrder::query()->where('course_id', $course->id)->exists()) {
            throw ValidationException::withMessages([
                'course' => ['Không thể xóa khóa học còn đơn mua tồn tại.'],
            ]);
        }

        $course->delete();
    }

    public function setPublished(Course $course, bool $value): Course
    {
        $course->update(['is_published' => $value]);

        return $course->fresh(['teacher']);
    }

    // ─── Delegates to AdminCourseScheduleService ──

    /** @param array<string,mixed> $data */
    public function createScheduleItem(Course $course, array $data): CourseScheduleItem
    {
        return $this->schedule->createScheduleItem($course, $data);
    }

    /** @param array<string,mixed> $data */
    public function updateScheduleItem(CourseScheduleItem $item, array $data): CourseScheduleItem
    {
        return $this->schedule->updateScheduleItem($item, $data);
    }

    public function deleteScheduleItem(CourseScheduleItem $item): void
    {
        $this->schedule->deleteScheduleItem($item);
    }

    // ─── Delegates to AdminCourseEnrollmentService ──

    public function listEnrollments(Course $course): Builder
    {
        return $this->enrollment->listEnrollments($course);
    }

    public function deleteEnrollment(CourseEnrollment $enrollment): void
    {
        $this->enrollment->deleteEnrollment($enrollment);
    }

    public function enrollProfile(Course $course, Profile $profile): CourseEnrollment
    {
        return $this->enrollment->enrollProfile($course, $profile);
    }

    public function setEnrollmentCommitment(CourseEnrollment $enrollment, bool $value): CourseEnrollment
    {
        return $this->enrollment->setEnrollmentCommitment($enrollment, $value);
    }

    // ─── Delegates to AdminCourseBookingService ──

    /** @return Collection<int,TeacherSlot> */
    public function listSlots(Course $course, ?CarbonImmutable $start = null, ?CarbonImmutable $end = null): Collection
    {
        return $this->booking->listSlots($course, $start, $end);
    }

    public function createSlot(Course $course, array $data): TeacherSlot
    {
        return $this->booking->createSlot($course, $data);
    }

    /** @return array{created: int, skipped: int} */
    public function bulkCreateSlots(Course $course, array $data): array
    {
        return $this->booking->bulkCreateSlots($course, $data);
    }

    public function updateSlot(TeacherSlot $slot, array $data): TeacherSlot
    {
        return $this->booking->updateSlot($slot, $data);
    }

    public function deleteSlot(TeacherSlot $slot): void
    {
        $this->booking->deleteSlot($slot);
    }

    public function listBookings(Course $course): Builder
    {
        return $this->booking->listBookings($course);
    }

    public function updateBookingMeetUrl(TeacherBooking $booking, ?string $meetUrl): TeacherBooking
    {
        return $this->booking->updateBookingMeetUrl($booking, $meetUrl);
    }

    public function cancelBooking(TeacherBooking $booking): TeacherBooking
    {
        return $this->booking->cancelBooking($booking);
    }
}
