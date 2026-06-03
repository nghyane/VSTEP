<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentProvider;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseEnrollmentOrder;
use App\Models\Profile;
use App\Services\Payment\OrderNotFoundAfterValidation;
use App\Services\Payment\PaymentGatewayRegistry;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * Course enrollment order lifecycle with payment gateway integration.
 *
 * Flow:
 * - createOrder() → creates pending order and returns payment_url
 * - handleCallback() → validates gateway callback and creates enrollment
 */
final class CourseOrderService
{
    public function __construct(
        private readonly CourseService $courseService,
        private readonly PaymentGatewayRegistry $gateways,
    ) {}

    /**
     * Create enrollment order (VND).
     */
    public function createOrder(
        Profile $profile,
        Course $course,
        PaymentProvider $provider,
        string $commitmentSignature,
        ?string $returnUrl = null,
    ): CourseEnrollmentOrder {
        if (! $course->is_published) {
            throw ValidationException::withMessages(['course' => ['Khóa học đang đóng ghi danh.']]);
        }
        if ($course->end_date->isPast()) {
            throw ValidationException::withMessages(['course' => ['Khóa học đã kết thúc.']]);
        }
        if ($course->isFull()) {
            throw ValidationException::withMessages(['course' => ['Khóa học đã đủ học viên.']]);
        }
        if ($course->price_vnd <= 0) {
            throw ValidationException::withMessages(['course' => ['Khóa học chưa có giá.']]);
        }

        // Check if user is already enrolled
        if ($this->isEnrolled($profile, $course)) {
            throw ValidationException::withMessages(['course' => ['Bạn đã ghi danh khóa học này.']]);
        }

        $existing = CourseEnrollmentOrder::query()
            ->where('profile_id', $profile->id)
            ->where('course_id', $course->id)
            ->whereIn('status', OrderStatus::activeValues())
            ->first();

        if ($existing?->isPaid()) {
            throw ValidationException::withMessages(['course' => ['Bạn đã ghi danh khóa học này.']]);
        }

        $amount = $course->price_vnd;
        $gateway = $this->gateways->get($provider);
        $expiryMinutes = (int) config('payment.order_expiry_minutes', 15);

        try {
            return DB::transaction(function () use ($profile, $course, $provider, $amount, $gateway, $expiryMinutes, $returnUrl, $commitmentSignature) {
                CourseEnrollmentOrder::query()
                    ->where('profile_id', $profile->id)
                    ->where('course_id', $course->id)
                    ->where('status', OrderStatus::Pending)
                    ->update(['status' => OrderStatus::Cancelled]);

                $order = CourseEnrollmentOrder::create([
                    'order_code' => $this->nextOrderCode(),
                    'profile_id' => $profile->id,
                    'course_id' => $course->id,
                    'amount_vnd' => $amount,
                    'status' => OrderStatus::Pending,
                    'payment_provider' => $provider->value,
                    'commitment_signature' => $commitmentSignature,
                    'expires_at' => now()->addMinutes($expiryMinutes),
                ]);

                $paymentReturnUrl = $returnUrl ?? config('app.frontend_url')."/khoa-hoc/{$course->id}";
                $cancelUrl = config('app.frontend_url')."/khoa-hoc/{$course->id}";
                $response = $gateway->createPayment($order, $paymentReturnUrl, $cancelUrl);

                $order->update([
                    'payment_url' => $response->paymentUrl,
                    'provider_ref' => $response->gatewayTransactionId,
                    'gateway_transaction_id' => $response->gatewayTransactionId,
                    'gateway_response' => $response->rawResponse,
                ]);

                return $order;
            });
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['course' => ['Bạn đang có đơn thanh toán chờ xác nhận cho khóa học này.']]);
        }
    }

    /** Handle webhook callback from payment gateway. */
    public function handleCallback(PaymentProvider $provider, array $data): CourseEnrollmentOrder
    {
        $gateway = $this->gateways->get($provider);
        $result = $gateway->validateCallback($data);

        if (! $result->success) {
            $this->markFailed($result->orderCode, $result->rawData);
            Log::warning('Course payment callback failed', [
                'provider' => $provider->value,
                'order_code' => $result->orderCode,
                'reason' => $result->failureReason,
            ]);

            throw new \RuntimeException($result->failureReason ?? 'Payment failed');
        }

        return $this->confirmByOrderCode(
            $result->orderCode,
            $result->gatewayTransactionId,
            $result->rawData,
        );
    }

    /** Confirm payment: create enrollment + credit bonus coins atomically. */
    public function confirmByOrderCode(
        int $orderCode,
        string $gatewayTransactionId,
        ?array $rawData,
    ): CourseEnrollmentOrder {
        return DB::transaction(function () use ($orderCode, $gatewayTransactionId, $rawData) {
            $locked = CourseEnrollmentOrder::query()
                ->where('order_code', $orderCode)
                ->lockForUpdate()
                ->first();

            if ($locked === null) {
                throw new OrderNotFoundAfterValidation($orderCode);
            }

            if ($locked->isPaid()) {
                return $locked;
            }

            if ($locked->status !== OrderStatus::Pending) {
                throw ValidationException::withMessages([
                    'order' => ["Đơn hàng ở trạng thái {$locked->status->value} không thể xác nhận."],
                ]);
            }

            // Guard: if enrollment already exists (edge case), still mark order paid
            if (CourseEnrollment::query()
                ->where('profile_id', $locked->profile_id)
                ->where('course_id', $locked->course_id)
                ->exists()
            ) {
                $locked->update([
                    'status' => OrderStatus::Paid,
                    'paid_at' => now(),
                    'gateway_transaction_id' => $gatewayTransactionId,
                    'gateway_response' => $rawData,
                    'callback_received_at' => now(),
                ]);

                return $locked;
            }

            // Create enrollment via single source of truth
            $this->courseService->createEnrollment(
                profile: $locked->profile,
                course: $locked->course,
                creditBonus: true,
                commitmentSignature: $locked->commitment_signature,
            );

            // Mark order paid
            $locked->update([
                'status' => OrderStatus::Paid,
                'paid_at' => now(),
                'gateway_transaction_id' => $gatewayTransactionId,
                'gateway_response' => $rawData,
                'callback_received_at' => now(),
            ]);

            return $locked;
        });
    }

    private function markFailed(int $orderCode, ?array $rawData): void
    {
        $order = CourseEnrollmentOrder::query()
            ->where('order_code', $orderCode)
            ->where('status', OrderStatus::Pending)
            ->first();

        if ($order !== null) {
            $order->update([
                'status' => OrderStatus::Failed,
                'gateway_response' => $rawData,
                'callback_received_at' => now(),
            ]);
        }
    }

    private function nextOrderCode(): int
    {
        return ((int) now()->getPreciseTimestamp(3) * 10) + 2;
    }

    public function getOrder(string $orderId): CourseEnrollmentOrder
    {
        return CourseEnrollmentOrder::query()
            ->with(['course', 'profile'])
            ->findOrFail($orderId);
    }

    public function getProfileOrders(Profile $profile): Collection
    {
        return CourseEnrollmentOrder::query()
            ->where('profile_id', $profile->id)
            ->with('course')
            ->orderByDesc('created_at')
            ->get();
    }

    private function isEnrolled(Profile $profile, Course $course): bool
    {
        return CourseEnrollment::query()
            ->where('profile_id', $profile->id)
            ->where('course_id', $course->id)
            ->exists();
    }
}
