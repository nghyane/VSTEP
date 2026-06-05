<?php

declare(strict_types=1);

namespace App\Services\Admin\Course\Contracts;

use App\Models\Course;
use App\Models\TeacherBooking;
use App\Models\TeacherSlot;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Database\Eloquent\Builder;

interface AdminCourseBookingInterface
{
    public function listSlots(Course $course, ?CarbonImmutable $start = null, ?CarbonImmutable $end = null): Builder;

    public function createSlot(Course $course, array $data): TeacherSlot;

    /** @return array{created: int, skipped: int} */
    public function bulkCreateSlots(Course $course, array $data): array;

    public function updateSlot(TeacherSlot $slot, array $data): TeacherSlot;

    public function deleteSlot(TeacherSlot $slot): void;

    public function listBookings(
        Course $course,
        ?string $status = null,
        ?string $search = null,
        string $sort = 'booked_at',
        string $direction = 'desc',
    ): Builder;

    public function updateBookingMeetUrl(TeacherBooking $booking, ?string $meetUrl): TeacherBooking;

    public function cancelBooking(TeacherBooking $booking): TeacherBooking;
}
