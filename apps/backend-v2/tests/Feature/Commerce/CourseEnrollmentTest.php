<?php

declare(strict_types=1);

namespace Tests\Feature\Commerce;

use App\Enums\BookingStatus;
use App\Enums\CoinTransactionType;
use App\Enums\ExamSessionStatus;
use App\Enums\SlotStatus;
use App\Jobs\SendPaymentInvoiceEmail;
use App\Models\CoinTransaction;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseEnrollmentOrder;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\ExamVersion;
use App\Models\Profile;
use App\Models\TeacherBooking;
use App\Models\TeacherSlot;
use App\Models\User;
use App\Services\Admin\Course\AdminCourseBookingService;
use App\Services\CourseOrderService;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Facade;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class CourseEnrollmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Http::fake([
            'api-merchant.payos.vn/v2/payment-requests' => Http::response([
                'data' => [
                    'checkoutUrl' => 'https://pay.payos.test/checkout',
                    'paymentLinkId' => 'payos_link_test',
                ],
            ]),
        ]);
    }

    public function test_enrollment_order_creates_pending(): void
    {
        [$user, $profile, $course] = $this->seedCourse(100_000, 200);

        $token = $this->tokenFor($user);
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/enrollment-orders", $this->enrollmentPayload());

        $response->assertCreated();
        $response->assertJsonPath('data.status', 'pending');
        $response->assertJsonPath('data.amount_vnd', 100_000);
    }

    public function test_enrollment_payment_redirect_forwards_client_urls(): void
    {
        $capturedPayload = null;
        Http::fake(function (Request $request) use (&$capturedPayload) {
            $capturedPayload = $request->data();

            return Http::response([
                'data' => [
                    'checkoutUrl' => 'https://pay.payos.test/checkout',
                    'paymentLinkId' => 'payos_link_test',
                ],
            ]);
        });

        [$user, $profile, $course] = $this->seedCourse(100_000, 200);
        $token = $this->tokenFor($user);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/enrollment-orders", $this->enrollmentPayload([
                'return_url' => "https://app.vstepgo.com/khoa-hoc/{$course->id}",
                'cancel_url' => "https://app.vstepgo.com/khoa-hoc/{$course->id}?from=payos",
            ]))
            ->assertCreated();

        $this->assertSame("https://app.vstepgo.com/khoa-hoc/{$course->id}", $capturedPayload['returnUrl']);
        $this->assertSame("https://app.vstepgo.com/khoa-hoc/{$course->id}?from=payos", $capturedPayload['cancelUrl']);
    }

    public function test_enrollment_payment_redirect_urls_are_required(): void
    {
        Http::fake();

        [$user, $profile, $course] = $this->seedCourse(100_000, 200);
        $token = $this->tokenFor($user);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/enrollment-orders", [
                'payment_provider' => 'payos',
                'commitment_signature' => $this->signatureSvg(),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['return_url', 'cancel_url']);

        Http::assertNothingSent();
    }

    public function test_enrollment_confirm_creates_enrollment_and_credits_bonus(): void
    {
        [$user, $profile, $course] = $this->seedCourse(100_000, 200);
        $wallet = $this->app->make(WalletService::class);
        Mail::fake();
        Queue::fake();

        $token = $this->tokenFor($user);
        $orderCode = $this->createEnrollmentOrder($token, $course);

        $confirmed = $this->app->make(CourseOrderService::class)
            ->confirmByOrderCode($orderCode, 'test_txn_id', null);

        $this->assertTrue($confirmed->isPaid());

        // Enrollment created
        $this->assertDatabaseHas('course_enrollments', [
            'profile_id' => $profile->id,
            'course_id' => $course->id,
            'bonus_coins_received' => 200,
            'commitment_signature' => $this->signatureSvg(),
        ]);

        // Bonus coins credited (onboarding bonus via SystemConfig may add more)
        $this->assertGreaterThanOrEqual(200, $wallet->getBalance($profile));
        Queue::assertPushed(SendPaymentInvoiceEmail::class, function (SendPaymentInvoiceEmail $job) use ($confirmed): bool {
            return $job->orderType === SendPaymentInvoiceEmail::TYPE_COURSE_ENROLLMENT
                && $job->orderId === $confirmed->id;
        });
    }

    public function test_enrollment_confirm_idempotent(): void
    {
        [$user, $profile, $course] = $this->seedCourse(100_000, 200);

        $token = $this->tokenFor($user);
        $orderCode = $this->createEnrollmentOrder($token, $course);
        $service = $this->app->make(CourseOrderService::class);

        $service->confirmByOrderCode($orderCode, 'test_txn_1', null);
        $second = $service->confirmByOrderCode($orderCode, 'test_txn_1', null);

        $this->assertTrue($second->isPaid());

        // Only 1 enrollment
        $count = CourseEnrollment::query()
            ->where('profile_id', $profile->id)
            ->where('course_id', $course->id)
            ->count();
        $this->assertSame(1, $count);
    }

    public function test_invoice_email_failure_does_not_fail_enrollment_confirmation(): void
    {
        [$user, $profile, $course] = $this->seedCourse(100_000, 200);

        $token = $this->tokenFor($user);
        $orderCode = $this->createEnrollmentOrder($token, $course);

        config(['queue.default' => 'sync']);
        Mail::shouldReceive('html')->andReturnNull();
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('SMTP down'));

        try {
            $confirmed = $this->app->make(CourseOrderService::class)
                ->confirmByOrderCode($orderCode, 'test_txn_id', null);

            $this->assertTrue($confirmed->isPaid());
            $this->assertDatabaseHas('course_enrollments', [
                'profile_id' => $profile->id,
                'course_id' => $course->id,
            ]);
            $this->assertDatabaseHas('course_enrollment_orders', [
                'order_code' => $orderCode,
                'status' => 'paid',
            ]);
        } finally {
            $this->restoreMailFacade();
        }
    }

    public function test_enrollment_rejects_full_course(): void
    {
        [$user, $profile, $course] = $this->seedCourse(100_000, 0, maxSlots: 1);

        // Fill the slot
        CourseEnrollment::create([
            'profile_id' => Profile::factory()->initial()->create()->id,
            'course_id' => $course->id,
            'enrolled_at' => now(), 'coins_paid' => 0, 'bonus_coins_received' => 0,
        ]);

        $token = $this->tokenFor($user);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/enrollment-orders", $this->enrollmentPayload())
            ->assertStatus(422);
    }

    public function test_enrollment_order_replaces_pending_order(): void
    {
        [$user, $profile, $course] = $this->seedCourse(100_000, 200);

        $token = $this->tokenFor($user);
        $first = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/enrollment-orders", $this->enrollmentPayload())
            ->assertCreated();

        $second = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/enrollment-orders", $this->enrollmentPayload())
            ->assertCreated();

        $this->assertDatabaseHas('course_enrollment_orders', [
            'id' => $first->json('data.id'),
            'status' => 'cancelled',
        ]);
        $this->assertDatabaseHas('course_enrollment_orders', [
            'id' => $second->json('data.id'),
            'status' => 'pending',
        ]);
        $this->assertSame(1, CourseEnrollmentOrder::query()->where('profile_id', $profile->id)->where('course_id', $course->id)->where('status', 'pending')->count());
    }

    public function test_enrollment_order_can_be_cancelled_by_owner(): void
    {
        [$user, $profile, $course] = $this->seedCourse(100_000, 200);

        $token = $this->tokenFor($user);
        $orderId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/enrollment-orders", $this->enrollmentPayload())
            ->assertCreated()
            ->json('data.id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/enrollment-orders/{$orderId}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertDatabaseHas('course_enrollment_orders', [
            'id' => $orderId,
            'profile_id' => $profile->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_enrollment_order_requires_commitment_signature(): void
    {
        [$user, $profile, $course] = $this->seedCourse(100_000, 200);

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($user))
            ->postJson("/api/v1/courses/{$course->id}/enrollment-orders", $this->enrollmentPayload(['commitment_signature' => null]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['commitment_signature']);
    }

    public function test_enrollment_order_rejects_non_svg_commitment_signature(): void
    {
        [$user, $profile, $course] = $this->seedCourse(100_000, 200);

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($user))
            ->postJson("/api/v1/courses/{$course->id}/enrollment-orders", $this->enrollmentPayload([
                'commitment_signature' => 'not-svg',
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['commitment_signature']);
    }

    public function test_booking_requires_commitment_met(): void
    {
        [$user, $profile, $course] = $this->seedCourse(100_000, 0);

        $token = $this->tokenFor($user);
        // Create + confirm enrollment
        $this->confirmEnrollment($token, $course);

        $slot = TeacherSlot::create([
            'course_id' => $course->id, 'teacher_id' => $course->teacher_id,
            'starts_at' => now()->addDay()->addHour(), 'status' => SlotStatus::Open,
        ]);

        // No full tests done → commitment pending → booking rejected
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/bookings", ['slot_id' => $slot->id])
            ->assertStatus(422);
    }

    public function test_booking_succeeds_after_commitment_met(): void
    {
        [$user, $profile, $course] = $this->seedCourse(100_000, 0);

        $token = $this->tokenFor($user);
        // Create + confirm enrollment
        $this->confirmEnrollment($token, $course);

        // Reload enrollment to get enrolled_at
        $enrollment = CourseEnrollment::query()
            ->where('profile_id', $profile->id)
            ->where('course_id', $course->id)
            ->first();

        // Simulate required full tests within the commitment window
        $exam = Exam::create(['slug' => 'e1', 'title' => 'E', 'total_duration_minutes' => 60, 'is_published' => true]);
        $version = ExamVersion::create(['exam_id' => $exam->id, 'version_number' => 1, 'is_active' => true]);
        for ($i = 0; $i < $course->required_full_tests; $i++) {
            ExamSession::create([
                'profile_id' => $profile->id, 'exam_version_id' => $version->id,
                'mode' => 'full', 'selected_skills' => ['listening', 'reading', 'writing', 'speaking'],
                'is_full_test' => true,
                'started_at' => $enrollment->enrolled_at->copy()->addHours(1),
                'server_deadline_at' => $enrollment->enrolled_at->copy()->addDays(1),
                'submitted_at' => $enrollment->enrolled_at->copy()->addDays(1),
                'status' => ExamSessionStatus::Submitted, 'coins_charged' => 25,
            ]);
        }

        $slot = TeacherSlot::create([
            'course_id' => $course->id, 'teacher_id' => $course->teacher_id,
            'starts_at' => now()->addDay()->addHour(), 'status' => SlotStatus::Open,
        ]);

        // Booking trừ 50 xu — credit đủ trước khi book.
        $wallet = $this->app->make(WalletService::class);
        $wallet->credit($profile, 100, CoinTransactionType::AdminGrant);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/bookings", ['slot_id' => $slot->id])
            ->assertCreated()
            ->assertJsonPath('data.slot.status', 'booked_me')
            ->assertJsonPath('data.coins_charged', 50);

        $this->assertDatabaseHas('teacher_bookings', [
            'profile_id' => $profile->id, 'slot_id' => $slot->id, 'status' => BookingStatus::Booked->value,
        ]);
        $this->assertDatabaseHas('teacher_slots', ['id' => $slot->id, 'status' => SlotStatus::Booked->value]);
        $this->assertSame(150, $wallet->getBalance($profile));
    }

    public function test_booking_page_returns_teacher_and_slot_grid(): void
    {
        [$user, $profile, $course] = $this->seedCourse(100_000, 0);
        $token = $this->tokenFor($user);

        $futureSlot = TeacherSlot::create([
            'course_id' => $course->id, 'teacher_id' => $course->teacher_id,
            'starts_at' => now()->addDays(2), 'status' => SlotStatus::Open,
        ]);
        $bookedByOther = TeacherSlot::create([
            'course_id' => $course->id, 'teacher_id' => $course->teacher_id,
            'starts_at' => now()->addDays(3), 'status' => SlotStatus::Booked,
        ]);
        $pastSlot = TeacherSlot::create([
            'course_id' => $course->id, 'teacher_id' => $course->teacher_id,
            'starts_at' => now()->subDays(2), 'status' => SlotStatus::Open,
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/courses/{$course->id}/bookings");

        $response->assertOk()
            ->assertJsonPath('data.teacher.id', $course->teacher_id)
            ->assertJsonPath('data.my_bookings_count', 0);

        $byId = collect($response->json('data.slots'))->keyBy('id');
        $this->assertSame('available', $byId[$futureSlot->id]['status']);
        $this->assertSame('booked_other', $byId[$bookedByOther->id]['status']);
        $this->assertSame('past', $byId[$pastSlot->id]['status']);
        $this->assertNull($byId[$futureSlot->id]['meet_url']);
    }

    public function test_booking_fails_when_insufficient_coins(): void
    {
        [$user, $profile, $course] = $this->seedCourse(100_000, 0);
        $token = $this->tokenFor($user);

        // Confirm enrollment + meet commitment (re-uses helper inline).
        $this->confirmEnrollment($token, $course);

        $enrollment = CourseEnrollment::query()
            ->where('profile_id', $profile->id)->where('course_id', $course->id)->first();

        $exam = Exam::create(['slug' => 'e2', 'title' => 'E2', 'total_duration_minutes' => 60, 'is_published' => true]);
        $version = ExamVersion::create(['exam_id' => $exam->id, 'version_number' => 1, 'is_active' => true]);
        for ($i = 0; $i < $course->required_full_tests; $i++) {
            ExamSession::create([
                'profile_id' => $profile->id, 'exam_version_id' => $version->id,
                'mode' => 'full', 'selected_skills' => ['listening', 'reading', 'writing', 'speaking'],
                'is_full_test' => true,
                'started_at' => $enrollment->enrolled_at->copy()->addHours(1),
                'server_deadline_at' => $enrollment->enrolled_at->copy()->addDays(1),
                'submitted_at' => $enrollment->enrolled_at->copy()->addDays(1),
                'status' => ExamSessionStatus::Submitted, 'coins_charged' => 25,
            ]);
        }

        $slot = TeacherSlot::create([
            'course_id' => $course->id, 'teacher_id' => $course->teacher_id,
            'starts_at' => now()->addDay()->addHour(), 'status' => SlotStatus::Open,
        ]);

        // Drain onboarding bonus để wallet trống — phải bị reject 422 và slot vẫn open.
        $wallet = $this->app->make(WalletService::class);
        $balance = $wallet->getBalance($profile);
        if ($balance > 0) {
            $wallet->spend($profile, $balance, CoinTransactionType::ExamFull);
        }

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/bookings", ['slot_id' => $slot->id])
            ->assertStatus(422);

        $this->assertDatabaseHas('teacher_slots', ['id' => $slot->id, 'status' => SlotStatus::Open->value]);
        $this->assertDatabaseMissing('teacher_bookings', ['slot_id' => $slot->id]);
    }

    public function test_admin_cancel_booking_refunds_once_and_reopens_slot(): void
    {
        [, $profile, $course] = $this->seedCourse(100_000, 0);
        $wallet = $this->app->make(WalletService::class);
        $wallet->credit($profile, 100, CoinTransactionType::AdminGrant);
        $balanceBeforeBooking = $wallet->getBalance($profile);

        $slot = TeacherSlot::create([
            'course_id' => $course->id,
            'teacher_id' => $course->teacher_id,
            'starts_at' => now()->addDays(2),
            'status' => SlotStatus::Booked,
        ]);
        $booking = TeacherBooking::create([
            'slot_id' => $slot->id,
            'profile_id' => $profile->id,
            'status' => BookingStatus::Booked,
            'booked_at' => now(),
        ]);
        $wallet->spend($profile, 50, CoinTransactionType::TeacherBooking, $booking);

        $cancelled = $this->app->make(AdminCourseBookingService::class)->cancelBooking($booking);

        $this->assertSame($balanceBeforeBooking, $wallet->getBalance($profile));
        $this->assertSame(BookingStatus::Cancelled, $cancelled->status);
        $this->assertNotNull($cancelled->cancelled_at);
        $this->assertDatabaseHas('teacher_slots', ['id' => $slot->id, 'status' => SlotStatus::Open->value]);
        $this->assertSame(1, CoinTransaction::query()
            ->where('profile_id', $profile->id)
            ->where('type', CoinTransactionType::Refund->value)
            ->where('source_id', $booking->id)
            ->count());

        try {
            $this->app->make(AdminCourseBookingService::class)->cancelBooking($booking->fresh());
            $this->fail('Expected cancelling an already-cancelled booking to fail.');
        } catch (ValidationException) {
            $this->assertSame(1, CoinTransaction::query()
                ->where('profile_id', $profile->id)
                ->where('type', CoinTransactionType::Refund->value)
                ->where('source_id', $booking->id)
                ->count());
            $this->assertSame($balanceBeforeBooking, $wallet->getBalance($profile));
        }
    }

    private function seedCourse(int $priceVnd, int $bonus, int $maxSlots = 20): array
    {
        $teacher = User::factory()->teacher()->create();
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();

        $course = Course::create([
            'slug' => 'crash-'.now()->timestamp, 'title' => 'Crash Course',
            'target_level' => 'B2', 'price_vnd' => $priceVnd, 'price_coins' => 0, 'bonus_coins' => $bonus,
            'max_slots' => $maxSlots, 'start_date' => now()->subDays(5), 'end_date' => now()->addMonth(),
            'required_full_tests' => 3, 'commitment_window_days' => 5,
            'teacher_id' => $teacher->id, 'is_published' => true,
        ]);

        return [$user, $profile, $course];
    }

    private function createEnrollmentOrder(string $token, Course $course): int
    {
        return $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/enrollment-orders", $this->enrollmentPayload())
            ->json('data.order_code');
    }

    /** @param  array<string, mixed>  $overrides */
    private function enrollmentPayload(array $overrides = []): array
    {
        return array_merge([
            'payment_provider' => 'payos',
            'commitment_signature' => $this->signatureSvg(),
            'return_url' => 'https://vstepgo.test/wallet',
            'cancel_url' => 'https://vstepgo.test/wallet',
        ], $overrides);
    }

    private function signatureSvg(): string
    {
        return '<svg xmlns="http://www.w3.org/2000/svg"><path d="M1 1L9 9"/></svg>';
    }

    private function confirmEnrollment(string $token, Course $course): void
    {
        $orderCode = $this->createEnrollmentOrder($token, $course);

        $this->app->make(CourseOrderService::class)
            ->confirmByOrderCode($orderCode, 'test_txn_id', null);
    }

    private function tokenFor(User $user): string
    {
        $response = $this
            ->withServerVariables(['REMOTE_ADDR' => '127.0.1.'.random_int(1, 250)])
            ->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);

        $response->assertOk();

        return (string) $response->json('data.access_token');
    }

    private function restoreMailFacade(): void
    {
        $this->app->forgetInstance('mail.manager');
        Facade::clearResolvedInstance('mail.manager');
    }
}
