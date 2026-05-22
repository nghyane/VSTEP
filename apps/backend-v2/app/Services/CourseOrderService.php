<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseEnrollmentOrder;
use App\Models\Profile;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Course enrollment order — mock VND payment.
 *
 * Phase 1 (mock):
 * - create order → status=pending
 * - confirm() → mark paid, create enrollment via CourseService
 *
 * Phase 2 (real gateway):
 * - create order → redirect to gateway
 * - webhook callback → confirm()
 */
final class CourseOrderService
{
    public function __construct(
        private readonly CourseService $courseService,
        private readonly NotificationService $notificationService,
    ) {}

    /**
     * Create enrollment order (VND).
     */
    public function createOrder(
        Profile $profile,
        Course $course,
        string $paymentProvider = 'mock',
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

        // Check if user already has paid or pending order for this course
        $existing = CourseEnrollmentOrder::query()
            ->where('profile_id', $profile->id)
            ->where('course_id', $course->id)
            ->whereIn('status', OrderStatus::activeValues())
            ->first();

        if ($existing !== null) {
            if ($existing->isPaid()) {
                throw ValidationException::withMessages(['course' => ['Bạn đã ghi danh khóa học này.']]);
            }
            throw ValidationException::withMessages(['course' => ['Bạn đang có đơn thanh toán chờ xác nhận cho khóa học này.']]);
        }

        $amount = $course->price_vnd;

        try {
            return CourseEnrollmentOrder::create([
                'profile_id' => $profile->id,
                'course_id' => $course->id,
                'amount_vnd' => $amount,
                'status' => OrderStatus::Pending,
                'payment_provider' => $paymentProvider,
                'provider_ref' => $paymentProvider === 'mock'
                    ? 'mock_'.Str::random(16)
                    : null,
            ]);
        } catch (QueryException $exception) {
            if ($this->isUniqueConstraintViolation($exception)) {
                throw ValidationException::withMessages(['course' => ['Bạn đang có đơn thanh toán chờ xác nhận cho khóa học này.']]);
            }

            throw $exception;
        }
    }

    /**
     * Confirm payment: create enrollment + credit bonus coins.
     * Idempotent: nếu đã paid → return order không duplicate.
     * $commitmentSignature: SVG do FE signature pad sinh, null nếu thiếu (BE
     * không enforce non-null vì admin manual enroll cũng đi qua flow khác).
     */
    public function confirm(CourseEnrollmentOrder $order, ?string $commitmentSignature = null): CourseEnrollmentOrder
    {
        return DB::transaction(function () use ($order, $commitmentSignature) {
            $locked = CourseEnrollmentOrder::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->first();

            if ($locked === null) {
                throw new \RuntimeException('Order not found during confirm.');
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
                ]);

                return $locked;
            }

            // Create enrollment via single source of truth
            $this->courseService->createEnrollment(
                profile: $locked->profile,
                course: $locked->course,
                creditBonus: true,
                commitmentSignature: $commitmentSignature,
            );

            // Mark order paid
            $locked->update([
                'status' => OrderStatus::Paid,
                'paid_at' => now(),
            ]);

            return $locked;
        });
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

    private function isUniqueConstraintViolation(QueryException $exception): bool
    {
        $sqlState = $exception->errorInfo[0] ?? null;
        $driverCode = $exception->errorInfo[1] ?? null;

        return $sqlState === '23505' || $driverCode === 19;
    }

    private function isEnrolled(Profile $profile, Course $course): bool
    {
        return CourseEnrollment::query()
            ->where('profile_id', $profile->id)
            ->where('course_id', $course->id)
            ->exists();
    }
}
