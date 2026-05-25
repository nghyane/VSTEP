<?php

declare(strict_types=1);

namespace App\Services\Admin\Course\Contracts;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Profile;
use Illuminate\Contracts\Database\Eloquent\Builder;

interface AdminCourseEnrollmentInterface
{
    public function listEnrollments(Course $course): Builder;

    public function deleteEnrollment(CourseEnrollment $enrollment): void;

    public function enrollProfile(Course $course, Profile $profile): CourseEnrollment;

    public function setEnrollmentCommitment(CourseEnrollment $enrollment, bool $value): CourseEnrollment;
}
