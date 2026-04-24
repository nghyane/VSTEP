<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CoinTransactionType;
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
 * - confirm() → mark paid, create enrollment, credit bonus coins
 *
 * Phase 2 (real gateway):
 * - create order → redirect to gateway
 * - webhook callback → confirm()
 */
class CourseOrderService
{
    public function __construct(
        private readonly WalletService $walletService,
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
            ->whereIn('status', ['pending', 'paid'])
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
                'status' => 'pending',
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
     */
    public function confirm(CourseEnrollmentOrder $order): CourseEnrollmentOrder
    {
        return DB::transaction(function () use ($order) {
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

            if ($locked->status !== 'pending') {
                throw ValidationException::withMessages([
                    'order' => ["Đơn hàng ở trạng thái {$locked->status} không thể xác nhận."],
                ]);
            }

            // Guard: if enrollment already exists (edge case), still mark order paid
            if (CourseEnrollment::query()
                ->where('profile_id', $locked->profile_id)
                ->where('course_id', $locked->course_id)
                ->exists()
            ) {
                $locked->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                ]);

                return $locked;
            }

            // Create enrollment
            $enrollment = CourseEnrollment::create([
                'profile_id' => $locked->profile_id,
                'course_id' => $locked->course_id,
                'enrolled_at' => now(),
                'coins_paid' => 0,
                'bonus_coins_received' => $locked->course->bonus_coins,
            ]);

            // Credit bonus coins
            if ($locked->course->bonus_coins > 0) {
                $this->walletService->credit(
                    profile: $locked->profile,
                    amount: $locked->course->bonus_coins,
                    type: CoinTransactionType::OnboardingBonus,
                    source: $enrollment,
                    metadata: ['reason' => 'course_bonus'],
                );
            }

            // Mark order paid
            $locked->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            DB::afterCommit(fn () => $this->notificationService->push(
                profile: $locked->profile,
                type: 'course_enrolled',
                title: 'Ghi danh thành công',
                body: "Bạn đã tham gia khóa {$locked->course->title}.",
                iconKey: 'book',
                dedupKey: "course_enroll:{$locked->course->id}:{$locked->profile->id}",
            ));

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
