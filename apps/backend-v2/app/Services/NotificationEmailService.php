<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Profile;
use App\Models\TeacherSlot;
use App\Models\User;
use Illuminate\Mail\Message;
use Illuminate\Support\Facades\Mail;

final class NotificationEmailService
{
    public function sendCourseEnrolled(Profile $profile, string $subject, string $body, string $courseId): void
    {
        $this->sendToProfile(
            $profile,
            $subject,
            [$body, 'Vào trang khóa học để xem lịch học và các yêu cầu cần hoàn thành.'],
            'Xem khóa học',
            "/khoa-hoc/{$courseId}",
        );
    }

    public function sendLearnerBookingCreated(Profile $profile, TeacherSlot $slot): void
    {
        $startsAt = $slot->starts_at->setTimezone('Asia/Ho_Chi_Minh')->format('d/m/Y H:i');

        $this->sendToProfile(
            $profile,
            'Đặt lịch học 1-1 thành công',
            [
                "Lịch hẹn 1-1 của bạn vào {$startsAt} đã được xác nhận.",
                'Link phòng học sẽ được giảng viên cập nhật trước buổi học.',
            ],
            'Xem lịch hẹn',
            "/khoa-hoc/{$slot->course_id}/dat-lich-1-1",
        );
    }

    public function sendTeacherBookingCreated(
        User $teacher,
        string $learnerName,
        string $courseName,
        string $startsAt,
    ): void {
        $this->sendToUser(
            $teacher,
            'Có học viên đặt lịch 1-1',
            [
                "{$learnerName} đã đặt slot {$startsAt} — {$courseName}.",
                'Vui lòng thêm link Google Meet trước buổi học.',
            ],
        );
    }

    public function sendAdminBookingCreated(
        User $admin,
        string $learnerName,
        string $teacherName,
        string $courseName,
        string $startsAt,
    ): void {
        $this->sendToUser(
            $admin,
            'Booking 1-1 mới',
            [
                "{$learnerName} đặt slot {$startsAt} với {$teacherName} — {$courseName}.",
                'Vui lòng kiểm tra nếu giáo viên cần hỗ trợ thêm link phòng học.',
            ],
        );
    }

    /** @param list<string> $lines */
    public function sendToProfile(
        Profile $profile,
        string $subject,
        array $lines,
        ?string $actionLabel = null,
        ?string $actionPath = null,
    ): void {
        $profile->loadMissing('account');
        $account = $profile->account;
        if ($account === null) {
            throw new \RuntimeException('Notification email requires a profile account.');
        }

        $this->sendToUser($account, $subject, $lines, $actionLabel, $actionPath);
    }

    /** @param list<string> $lines */
    public function sendToUser(
        User $user,
        string $subject,
        array $lines,
        ?string $actionLabel = null,
        ?string $actionPath = null,
    ): void {
        $email = trim((string) $user->email);
        if ($email === '') {
            throw new \RuntimeException('Notification email requires a recipient email.');
        }

        $body = $this->bodyHtml($lines, $actionLabel, $actionPath);

        Mail::html($body, function (Message $message) use ($email, $subject): void {
            $message->to($email)->subject($subject);
        });
    }

    /** @param list<string> $lines */
    private function bodyHtml(array $lines, ?string $actionLabel, ?string $actionPath): string
    {
        $paragraphs = array_map(
            fn (string $line): string => '<p style="margin:0 0 16px;color:#1f2937;font-size:16px;line-height:1.6;">'.e(trim($line)).'</p>',
            array_filter(array_map('trim', $lines)),
        );

        $button = '';
        if ($actionLabel !== null && $actionPath !== null) {
            $button = '<p style="margin:24px 0;">'
                .'<a href="'.e($this->frontendUrl($actionPath)).'" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px;">'
                .e($actionLabel)
                .'</a></p>';
        }

        return '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;">'
            .implode('', $paragraphs)
            .$button
            .'<p style="margin:24px 0 0;color:#9ca3af;font-size:14px;">VSTEP</p>'
            .'</div>';
    }

    private function frontendUrl(string $path): string
    {
        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');
        if ($frontendUrl === '') {
            throw new \RuntimeException('app.frontend_url must be configured for notification emails.');
        }

        return $frontendUrl.'/'.ltrim($path, '/');
    }
}
