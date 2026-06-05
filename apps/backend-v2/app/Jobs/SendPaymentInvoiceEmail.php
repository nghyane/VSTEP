<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\CourseEnrollmentOrder;
use App\Models\WalletTopupOrder;
use App\Services\NotificationEmailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

final class SendPaymentInvoiceEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public const TYPE_COURSE_ENROLLMENT = 'course_enrollment';

    public const TYPE_TOPUP = 'topup';

    public function __construct(
        public readonly string $orderType,
        public readonly string $orderId,
    ) {}

    public function handle(NotificationEmailService $emailService): void
    {
        if ($this->orderType === self::TYPE_COURSE_ENROLLMENT) {
            $order = CourseEnrollmentOrder::query()->with(['profile', 'course'])->findOrFail($this->orderId);
            if ($order->profile !== null) {
                $emailService->sendCourseEnrollmentInvoice($order->profile, $order);
            }

            return;
        }

        if ($this->orderType === self::TYPE_TOPUP) {
            $order = WalletTopupOrder::query()->with('profile')->findOrFail($this->orderId);
            if ($order->profile !== null) {
                $emailService->sendTopupInvoice($order->profile, $order);
            }

            return;
        }

        throw new \RuntimeException("Unsupported invoice order type [{$this->orderType}].");
    }
}
