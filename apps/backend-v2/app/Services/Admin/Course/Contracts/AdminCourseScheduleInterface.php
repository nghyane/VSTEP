<?php

declare(strict_types=1);

namespace App\Services\Admin\Course\Contracts;

use App\Models\Course;
use App\Models\CourseScheduleItem;

interface AdminCourseScheduleInterface
{
    public function createScheduleItem(Course $course, array $data): CourseScheduleItem;

    public function updateScheduleItem(CourseScheduleItem $item, array $data): CourseScheduleItem;

    public function deleteScheduleItem(CourseScheduleItem $item): void;
}
