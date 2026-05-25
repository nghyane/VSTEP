<?php

declare(strict_types=1);

namespace App\Services\Admin\Course;

use App\Models\Course;
use App\Models\CourseScheduleItem;
use App\Services\Admin\Course\Contracts\AdminCourseScheduleInterface;

final class AdminCourseScheduleService implements AdminCourseScheduleInterface
{
    public function createScheduleItem(Course $course, array $data): CourseScheduleItem
    {
        if (! array_key_exists('session_number', $data) || $data['session_number'] === null) {
            $data['session_number'] = (int) $course->scheduleItems()->max('session_number') + 1;
        }
        $data['course_id'] = $course->id;

        return CourseScheduleItem::create($data);
    }

    public function updateScheduleItem(CourseScheduleItem $item, array $data): CourseScheduleItem
    {
        $item->update($data);

        return $item->fresh();
    }

    public function deleteScheduleItem(CourseScheduleItem $item): void
    {
        $item->delete();
    }
}
