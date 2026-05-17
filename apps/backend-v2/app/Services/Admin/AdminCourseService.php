<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseEnrollmentOrder;
use App\Models\CourseScheduleItem;
use App\Models\Profile;
use App\Services\NotificationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdminCourseService
{
    public function __construct(
        private readonly NotificationService $notificationService,
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
        $course->forceFill(['is_published' => $value])->save();

        return $course->fresh(['teacher']);
    }

    // ─── Schedule items (buổi học chung của khóa) ──────────

    /**
     * @param  array<string,mixed>  $data
     */
    public function createScheduleItem(Course $course, array $data): CourseScheduleItem
    {
        // Auto-assign session_number = max + 1 nếu admin không truyền.
        if (! array_key_exists('session_number', $data) || $data['session_number'] === null) {
            $data['session_number'] = (int) $course->scheduleItems()->max('session_number') + 1;
        }
        $data['course_id'] = $course->id;

        return CourseScheduleItem::create($data);
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function updateScheduleItem(CourseScheduleItem $item, array $data): CourseScheduleItem
    {
        $item->fill($data)->save();

        return $item->refresh();
    }

    public function deleteScheduleItem(CourseScheduleItem $item): void
    {
        $item->delete();
    }

    // ─── Enrollments (read-only) ───────────────────────────

    /**
     * Builder để admin xem danh sách học viên đã ghi danh khóa.
     * Eager-load profile + account để hiển thị tên/email.
     */
    public function listEnrollments(Course $course): Builder
    {
        return CourseEnrollment::query()
            ->where('course_id', $course->id)
            ->with(['profile:id,account_id,nickname,target_level,target_deadline', 'profile.account:id,full_name,email'])
            ->orderByDesc('enrolled_at');
    }

    /**
     * Hủy ghi danh — hard delete row. Coin_transactions giữ nguyên (append-only ledger
     * theo design-decisions §2); không refund tự động, admin tự xử lý qua kênh riêng.
     * Push notification cho học viên để họ biết bị unenroll.
     */
    public function deleteEnrollment(CourseEnrollment $enrollment): void
    {
        // Lấy thông tin trước khi xóa để dùng trong notification.
        $enrollment->loadMissing(['profile', 'course']);
        $profile = $enrollment->profile;
        $course = $enrollment->course;
        $courseTitle = $course?->title ?? 'khóa học';
        $courseId = $course?->id;

        DB::transaction(function () use ($enrollment) {
            $enrollment->delete();
        });

        if ($profile !== null) {
            // Sau commit để chắc chắn DB đã xóa trước khi gửi noti.
            DB::afterCommit(fn () => $this->notificationService->push(
                profile: $profile,
                type: 'course_unenrolled',
                title: 'Bạn đã bị hủy ghi danh',
                body: "Admin đã hủy ghi danh của bạn khỏi khóa \"{$courseTitle}\". "
                    .'Nếu cần làm rõ, vui lòng liên hệ trung tâm.',
                iconKey: 'alert',
                payload: $courseId !== null ? ['course_id' => $courseId] : null,
            ));
        }
    }

    /**
     * Admin thêm thủ công học viên vào khóa (ngoài luồng mua bằng xu).
     * - Chặn nếu profile đã ghi danh khóa này.
     * - Chặn nếu khóa đã full theo max_slots.
     * - Không trừ/credit xu — admin thêm tay thường là comp / xử lý ngoài hệ thống.
     * - Push noti để học viên biết đã được thêm vào khóa.
     */
    public function enrollProfile(Course $course, Profile $profile): CourseEnrollment
    {
        return DB::transaction(function () use ($course, $profile) {
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
                    'profile_id' => ['Học viên này đã ghi danh khóa.'],
                ]);
            }

            if ($locked->soldSlots() >= $locked->max_slots) {
                throw ValidationException::withMessages([
                    'profile_id' => ['Khóa học đã đủ số học viên tối đa.'],
                ]);
            }

            $enrollment = CourseEnrollment::create([
                'profile_id' => $profile->id,
                'course_id' => $locked->id,
                'enrolled_at' => now(),
                'coins_paid' => 0,
                'bonus_coins_received' => 0,
            ]);

            DB::afterCommit(fn () => $this->notificationService->push(
                profile: $profile,
                type: 'course_enrolled',
                title: 'Bạn đã được thêm vào khóa',
                body: "Admin đã thêm bạn vào khóa \"{$locked->title}\". Vào mục Khóa học để xem lịch buổi học.",
                iconKey: 'book',
                payload: ['course_id' => $locked->id],
                dedupKey: "course_enroll:{$locked->id}:{$profile->id}",
            ));

            return $enrollment->fresh(['profile.account']);
        });
    }

    public function setEnrollmentCommitment(CourseEnrollment $enrollment, bool $value): CourseEnrollment
    {
        $enrollment->forceFill(['acknowledged_commitment' => $value])->save();

        return $enrollment->fresh(['profile.account']);
    }
}
