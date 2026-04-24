<?php

declare(strict_types=1);

namespace Tests\Feature\Commerce;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\ExamVersion;
use App\Models\Profile;
use App\Models\TeacherSlot;
use App\Models\User;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CourseEnrollmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_enrollment_order_creates_pending(): void
    {
        [$user, $profile, $course] = $this->seedCourse(100_000, 200);

        $token = $this->tokenFor($user);
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/enrollment-orders");

        $response->assertCreated();
        $response->assertJsonPath('data.status', 'pending');
        $response->assertJsonPath('data.amount_vnd', 100_000);
    }

    public function test_enrollment_confirm_creates_enrollment_and_credits_bonus(): void
    {
        [$user, $profile, $course] = $this->seedCourse(100_000, 200);
        $wallet = $this->app->make(WalletService::class);

        $token = $this->tokenFor($user);
        $order = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/enrollment-orders")
            ->json('data');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/enrollment-orders/{$order['id']}/confirm");

        $response->assertOk();
        $response->assertJsonPath('data.status', 'paid');

        // Enrollment created
        $this->assertDatabaseHas('course_enrollments', [
            'profile_id' => $profile->id,
            'course_id' => $course->id,
            'bonus_coins_received' => 200,
        ]);

        // Bonus coins credited (onboarding bonus via SystemConfig may add more)
        $this->assertGreaterThanOrEqual(200, $wallet->getBalance($profile));
    }

    public function test_enrollment_confirm_idempotent(): void
    {
        [$user, $profile, $course] = $this->seedCourse(100_000, 200);

        $token = $this->tokenFor($user);
        $order = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/enrollment-orders")
            ->json('data');

        // First confirm
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/enrollment-orders/{$order['id']}/confirm")
            ->assertOk();

        // Second confirm — should return same order without duplicate enrollment
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/enrollment-orders/{$order['id']}/confirm");

        $response->assertOk();
        $response->assertJsonPath('data.status', 'paid');

        // Only 1 enrollment
        $count = CourseEnrollment::query()
            ->where('profile_id', $profile->id)
            ->where('course_id', $course->id)
            ->count();
        $this->assertSame(1, $count);
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
            ->postJson("/api/v1/courses/{$course->id}/enrollment-orders")
            ->assertStatus(422);
    }

    public function test_enrollment_rejects_duplicate(): void
    {
        [$user, $profile, $course] = $this->seedCourse(100_000, 200);

        $token = $this->tokenFor($user);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/enrollment-orders")
            ->assertCreated();

        // Second attempt — already has pending order
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/enrollment-orders")
            ->assertStatus(422);
    }

    public function test_booking_requires_commitment_met(): void
    {
        [$user, $profile, $course] = $this->seedCourse(100_000, 0);

        $token = $this->tokenFor($user);
        // Create + confirm enrollment
        $order = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/enrollment-orders")
            ->json('data');
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/enrollment-orders/{$order['id']}/confirm")
            ->assertOk();

        $slot = TeacherSlot::create([
            'course_id' => $course->id, 'teacher_id' => $course->teacher_id,
            'starts_at' => now()->addDay(), 'status' => 'open',
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
        $order = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/enrollment-orders")
            ->json('data');
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/enrollment-orders/{$order['id']}/confirm")
            ->assertOk();

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
                'started_at' => $enrollment->enrolled_at->copy()->addDays($course->exam_cooldown_days),
                'server_deadline_at' => $enrollment->enrolled_at->copy()->addDays($course->exam_cooldown_days + 1),
                'submitted_at' => $enrollment->enrolled_at->copy()->addDays($course->exam_cooldown_days + 1),
                'status' => 'submitted', 'coins_charged' => 25,
            ]);
        }

        $slot = TeacherSlot::create([
            'course_id' => $course->id, 'teacher_id' => $course->teacher_id,
            'starts_at' => now()->addDay(), 'status' => 'open',
        ]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/bookings", ['slot_id' => $slot->id])
            ->assertCreated();

        $this->assertDatabaseHas('teacher_bookings', [
            'profile_id' => $profile->id, 'slot_id' => $slot->id, 'status' => 'booked',
        ]);
        $this->assertDatabaseHas('teacher_slots', ['id' => $slot->id, 'status' => 'booked']);
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
            'required_full_tests' => 3, 'commitment_window_days' => 20,
            'exam_cooldown_days' => 5, 'teacher_id' => $teacher->id, 'is_published' => true,
        ]);

        return [$user, $profile, $course];
    }

    private function tokenFor(User $user): string
    {
        return $this->postJson('/api/v1/auth/login', [
            'email' => $user->email, 'password' => 'password',
        ])->json('data.access_token');
    }
}
