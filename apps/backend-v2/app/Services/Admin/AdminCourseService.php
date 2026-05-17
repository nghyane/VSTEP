<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\Course;
use App\Models\CourseEnrollmentOrder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

class AdminCourseService
{
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
}
