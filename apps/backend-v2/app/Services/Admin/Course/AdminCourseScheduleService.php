<?php

declare(strict_types=1);

namespace App\Services\Admin\Course;

use App\Enums\IconKey;
use App\Enums\NotificationType;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseScheduleItem;
use App\Models\Profile;
use App\Models\TeacherSlot;
use App\Services\Admin\Course\Contracts\AdminCourseScheduleInterface;
use App\Services\NotificationEmailService;
use App\Services\NotificationService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

final class AdminCourseScheduleService implements AdminCourseScheduleInterface
{
    public function __construct(
        private readonly NotificationService $notification,
        private readonly NotificationEmailService $email,
    ) {}

    public function createScheduleItem(Course $course, array $data): CourseScheduleItem
    {
        $this->guardScheduleItemDoesNotConflict($course, $data);

        if (! array_key_exists('session_number', $data) || $data['session_number'] === null) {
            $data['session_number'] = (int) $course->scheduleItems()->max('session_number') + 1;
        }
        $data['course_id'] = $course->id;

        return CourseScheduleItem::create($data);
    }

    public function updateScheduleItem(CourseScheduleItem $item, array $data, bool $notifyLearners = false): CourseScheduleItem
    {
        unset($data['notify_learners']);
        $oldDate = $item->date->setTimezone('Asia/Ho_Chi_Minh')->format('d/m/Y');
        $oldStartTime = substr((string) $item->start_time, 0, 5);
        $course = $item->course ?? Course::query()->findOrFail($item->course_id);

        $this->guardScheduleItemDoesNotConflict(
            $course,
            array_merge([
                'date' => $item->date->toDateString(),
                'start_time' => substr((string) $item->start_time, 0, 5),
                'end_time' => substr((string) $item->end_time, 0, 5),
            ], $data),
            exceptId: $item->id,
        );

        $item->update($data);

        $fresh = $item->fresh(['course']);
        if ($notifyLearners) {
            $this->notifyCourseLearnersRescheduled($fresh, $oldDate, $oldStartTime);
        }

        return $fresh;
    }

    public function cancelScheduleItem(CourseScheduleItem $item, ?string $reason = null): CourseScheduleItem
    {
        if ($item->status === 'cancelled') {
            return $item->fresh(['course']);
        }

        $item->update([
            'status' => 'cancelled',
            'cancel_reason' => $reason,
        ]);

        $fresh = $item->fresh(['course']);
        $this->notifyCourseLearnersCancelled($fresh, $reason);

        return $fresh;
    }

    public function deleteScheduleItem(CourseScheduleItem $item): void
    {
        $item->delete();
    }

    private function notifyCourseLearnersRescheduled(CourseScheduleItem $item, string $oldDate, string $oldStartTime): void
    {
        foreach ($this->courseProfiles($item) as $profile) {
            $notification = $this->notification->push(
                $profile,
                NotificationType::CourseSessionRescheduled,
                'Buổi học đã được dời lịch',
                'Vui lòng vào trang khóa học để xem lịch cập nhật.',
                IconKey::Calendar,
                ['course_id' => $item->course_id, 'schedule_item_id' => $item->id],
                "course_session_rescheduled:{$item->id}:{$item->date->toDateString()}:{$item->start_time}:{$profile->id}",
            );
            if ($notification !== null) {
                $this->email->sendCourseSessionRescheduled($profile, $item, $oldDate, $oldStartTime);
            }
        }
    }

    private function guardScheduleItemDoesNotConflict(Course $course, array $data, ?string $exceptId = null): void
    {
        $tz = 'Asia/Ho_Chi_Minh';
        $date = (string) $data['date'];
        $startTime = substr((string) $data['start_time'], 0, 5);
        $endTime = substr((string) $data['end_time'], 0, 5);
        $itemStart = CarbonImmutable::parse("{$date} {$startTime}", $tz);
        $itemEnd = CarbonImmutable::parse("{$date} {$endTime}", $tz);

        $scheduleQuery = CourseScheduleItem::query()
            ->whereDate('date', $date)
            ->where('status', '!=', 'cancelled')
            ->whereHas('course', fn ($query) => $query->where('teacher_id', $course->teacher_id));
        if ($exceptId !== null) {
            $scheduleQuery->where('id', '!=', $exceptId);
        }

        $hasScheduleConflict = $scheduleQuery
            ->get(['date', 'start_time', 'end_time'])
            ->contains(function (CourseScheduleItem $existing) use ($itemStart, $itemEnd, $tz): bool {
                $existingStart = CarbonImmutable::parse($existing->date->toDateString().' '.substr((string) $existing->start_time, 0, 5), $tz);
                $existingEnd = CarbonImmutable::parse($existing->date->toDateString().' '.substr((string) $existing->end_time, 0, 5), $tz);

                return $existingStart->lt($itemEnd) && $existingEnd->gt($itemStart);
            });

        if ($hasScheduleConflict) {
            throw ValidationException::withMessages([
                'start_time' => ['Giáo viên đã có buổi học khác trùng khung giờ này.'],
            ]);
        }

        $hasSlotConflict = TeacherSlot::query()
            ->where('teacher_id', $course->teacher_id)
            ->where('starts_at', '<', $itemEnd->utc())
            ->whereRaw("starts_at + (duration_minutes * interval '1 minute') > ?", [$itemStart->utc()])
            ->exists();

        if ($hasSlotConflict) {
            throw ValidationException::withMessages([
                'start_time' => ['Khung giờ này trùng với slot 1-1 của giáo viên.'],
            ]);
        }
    }

    private function notifyCourseLearnersCancelled(CourseScheduleItem $item, ?string $reason): void
    {
        foreach ($this->courseProfiles($item) as $profile) {
            $notification = $this->notification->push(
                $profile,
                NotificationType::CourseSessionCancelled,
                'Buổi học đã bị hủy',
                'Vui lòng theo dõi thông báo từ trung tâm để biết lịch học tiếp theo.',
                IconKey::Alert,
                ['course_id' => $item->course_id, 'schedule_item_id' => $item->id],
                "course_session_cancelled:{$item->id}:{$profile->id}",
            );
            if ($notification !== null) {
                $this->email->sendCourseSessionCancelled($profile, $item, $reason);
            }
        }
    }

    /** @return Collection<int, Profile> */
    private function courseProfiles(CourseScheduleItem $item): Collection
    {
        return CourseEnrollment::query()
            ->where('course_id', $item->course_id)
            ->with('profile.account')
            ->get()
            ->pluck('profile')
            ->filter()
            ->values();
    }
}
