<?php

declare(strict_types=1);

namespace App\Services\Admin\Course;

use App\Enums\IconKey;
use App\Enums\NotificationType;
use App\Enums\OrderStatus;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseEnrollmentOrder;
use App\Models\Profile;
use App\Services\Admin\Course\Contracts\AdminCourseEnrollmentInterface;
use App\Services\CourseService;
use App\Services\NotificationEmailService;
use App\Services\NotificationService;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

final class AdminCourseEnrollmentService implements AdminCourseEnrollmentInterface
{
    public function __construct(
        private readonly CourseService $courseService,
        private readonly NotificationService $notification,
        private readonly NotificationEmailService $email,
    ) {}

    public function listEnrollments(Course $course): Builder
    {
        return CourseEnrollment::query()
            ->where('course_id', $course->id)
            ->with(['profile:id,account_id,nickname,target_level,target_deadline', 'profile.account:id,full_name,email'])
            ->orderByDesc('enrolled_at');
    }

    public function deleteEnrollment(CourseEnrollment $enrollment): void
    {
        $enrollment->loadMissing(['profile', 'course']);
        $profile = $enrollment->profile;
        $course = $enrollment->course;
        $courseTitle = $course?->title ?? 'khóa học';
        $courseId = $course?->id;

        DB::transaction(function () use ($enrollment, $profile, $courseId) {
            $enrollment->delete();
            if ($profile !== null && $courseId !== null) {
                CourseEnrollmentOrder::query()
                    ->where('profile_id', $profile->id)
                    ->where('course_id', $courseId)
                    ->whereIn('status', OrderStatus::activeValues())
                    ->update(['status' => OrderStatus::Cancelled]);
            }
        });

        if ($profile !== null) {
            DB::afterCommit(function () use ($profile, $courseTitle, $courseId): void {
                $notification = $this->notification->push(
                    profile: $profile,
                    type: NotificationType::CourseUnenrolled,
                    title: 'Bạn đã bị hủy ghi danh',
                    body: "Admin đã hủy ghi danh của bạn khỏi khóa \"{$courseTitle}\". Nếu cần làm rõ, vui lòng liên hệ trung tâm.",
                    iconKey: IconKey::Alert,
                    payload: $courseId !== null ? ['course_id' => $courseId] : null,
                );

                if ($notification !== null) {
                    $this->email->sendToProfile(
                        $profile,
                        'Ghi danh khóa học đã bị hủy',
                        ["Ghi danh của bạn khỏi khóa \"{$courseTitle}\" đã bị hủy. Nếu cần làm rõ, vui lòng liên hệ trung tâm."],
                        'Xem khóa học',
                        '/khoa-hoc',
                    );
                }
            });
        }
    }

    public function enrollProfile(Course $course, Profile $profile): CourseEnrollment
    {
        return DB::transaction(function () use ($course, $profile) {
            return $this->courseService->createEnrollment(
                profile: $profile,
                course: $course,
                creditBonus: false,
                notiTitle: 'Bạn đã được thêm vào khóa',
                notiBody: "Admin đã thêm bạn vào khóa \"{$course->title}\". Vào mục Khóa học để xem lịch buổi học.",
            )->fresh(['profile.account']);
        });
    }

    public function setEnrollmentCommitment(CourseEnrollment $enrollment, bool $value): CourseEnrollment
    {
        $enrollment->update(['acknowledged_commitment' => $value]);

        return $enrollment->fresh(['profile.account']);
    }
}
