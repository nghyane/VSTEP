<?php

declare(strict_types=1);

namespace App\Services;

use App\Mail\CourseEnrollmentInvoiceMail;
use App\Mail\TopupInvoiceMail;
use App\Models\CourseEnrollmentOrder;
use App\Models\CourseScheduleItem;
use App\Models\Profile;
use App\Models\TeacherSlot;
use App\Models\User;
use App\Models\WalletTopupOrder;
use Illuminate\Mail\Message;
use Illuminate\Support\Facades\Mail;

final class NotificationEmailService
{
    public function __construct(private readonly SupportConfigService $supportConfig) {}

    public function sendCourseEnrollmentInvoice(Profile $profile, CourseEnrollmentOrder $order): void
    {
        $order->loadMissing('course');
        $paidAt = $order->paid_at?->setTimezone('Asia/Ho_Chi_Minh')->format('d/m/Y H:i') ?? now('Asia/Ho_Chi_Minh')->format('d/m/Y H:i');
        $profile->loadMissing('account');
        $account = $profile->account;
        if ($account === null) {
            throw new \RuntimeException('Course invoice email requires a profile account.');
        }

        $email = trim((string) $account->email);
        if ($email === '') {
            throw new \RuntimeException('Course invoice email requires a recipient email.');
        }

        $courseTitle = $order->course?->title ?? 'Khóa học VSTEP';
        $body = $this->bodyHtml(
            [
                'Thanh toán đăng ký khóa học của bạn đã thành công.',
                'Khóa học: '.$courseTitle.'.',
                'Mã đơn: '.$order->order_code.'.',
                'Số tiền: '.number_format($order->amount_vnd, 0, ',', '.').'đ.',
                'Thời gian thanh toán: '.$paidAt.'.',
            ],
            'Xem khóa học',
            "/khoa-hoc/{$order->course_id}",
        );

        Mail::to($email)->send(new CourseEnrollmentInvoiceMail($body));
    }

    public function sendTopupInvoice(Profile $profile, WalletTopupOrder $order): void
    {
        $paidAt = $order->paid_at?->setTimezone('Asia/Ho_Chi_Minh')->format('d/m/Y H:i') ?? now('Asia/Ho_Chi_Minh')->format('d/m/Y H:i');
        $profile->loadMissing('account');
        $account = $profile->account;
        if ($account === null) {
            throw new \RuntimeException('Topup invoice email requires a profile account.');
        }

        $email = trim((string) $account->email);
        if ($email === '') {
            throw new \RuntimeException('Topup invoice email requires a recipient email.');
        }

        $body = $this->bodyHtml(
            [
                'Thanh toán nạp xu của bạn đã thành công.',
                'Mã đơn: '.$order->order_code.'.',
                'Số tiền: '.number_format($order->amount_vnd, 0, ',', '.').'đ.',
                'Số xu đã cộng: '.number_format($order->coins_to_credit, 0, ',', '.').' xu.',
                'Thời gian thanh toán: '.$paidAt.'.',
            ],
            'Xem ví của bạn',
            '/dashboard',
        );

        Mail::to($email)->send(new TopupInvoiceMail($body));
    }

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

    public function sendLearnerBookingRescheduled(Profile $profile, TeacherSlot $oldSlot, TeacherSlot $newSlot): void
    {
        $oldStartsAt = $oldSlot->starts_at->setTimezone('Asia/Ho_Chi_Minh')->format('d/m/Y H:i');
        $newStartsAt = $newSlot->starts_at->setTimezone('Asia/Ho_Chi_Minh')->format('d/m/Y H:i');

        $this->sendToProfile(
            $profile,
            'Lịch học 1-1 đã được dời',
            [
                "Lịch hẹn 1-1 cũ vào {$oldStartsAt} đã được dời sang {$newStartsAt}.",
                'Vui lòng kiểm tra lại lịch hẹn trong trang khóa học.',
                $this->supportLine(),
            ],
            'Xem lịch hẹn',
            "/khoa-hoc/{$newSlot->course_id}/dat-lich-1-1",
        );
    }

    public function sendCourseSessionRescheduled(Profile $profile, CourseScheduleItem $item, string $oldDate, string $oldStartTime): void
    {
        $item->loadMissing('course');
        $courseTitle = $item->course?->title ?? 'Khóa học VSTEP';
        $newDate = $item->date->setTimezone('Asia/Ho_Chi_Minh')->format('d/m/Y');
        $newTime = substr((string) $item->start_time, 0, 5);

        $this->sendToProfile(
            $profile,
            'Buổi học đã được dời lịch',
            [
                "Buổi học của khóa {$courseTitle} vào {$oldStartTime} {$oldDate} đã được dời sang {$newTime} {$newDate}.",
                'Vui lòng vào trang khóa học để xem lịch cập nhật.',
                $this->supportLine(),
            ],
            'Xem khóa học',
            "/khoa-hoc/{$item->course_id}",
        );
    }

    public function sendCourseSessionCancelled(Profile $profile, CourseScheduleItem $item, ?string $reason = null): void
    {
        $item->loadMissing('course');
        $courseTitle = $item->course?->title ?? 'Khóa học VSTEP';
        $date = $item->date->setTimezone('Asia/Ho_Chi_Minh')->format('d/m/Y');
        $time = substr((string) $item->start_time, 0, 5);
        $lines = [
            "Buổi học của khóa {$courseTitle} vào {$time} {$date} đã bị hủy.",
            'Vui lòng theo dõi thông báo từ trung tâm để biết lịch học tiếp theo.',
        ];
        if ($reason !== null && trim($reason) !== '') {
            $lines[] = 'Lý do: '.trim($reason).'.';
        }
        $lines[] = $this->supportLine();

        $this->sendToProfile($profile, 'Buổi học đã bị hủy', $lines, 'Xem khóa học', "/khoa-hoc/{$item->course_id}");
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

    public function supportLine(): string
    {
        return 'Nếu cần hỗ trợ thêm, vui lòng liên hệ Zalo/SĐT: '.$this->supportConfig->zaloPhone().'.';
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
