<?php

declare(strict_types=1);

namespace Tests\Feature\Commerce;

use App\Enums\CoinTransactionType;
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

    public function test_enroll_charges_coins_and_grants_bonus(): void
    {
        [$user, $profile, $course] = $this->seedCourse(2000, 200);
        $wallet = $this->app->make(WalletService::class);
        $wallet->credit($profile, 2000, CoinTransactionType::Topup);

        $token = $this->tokenFor($user);
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/enroll");

        $response->assertCreated();
        $response->assertJsonPath('data.coins_paid', 2000);
        $response->assertJsonPath('data.bonus_received', 200);

        // 100 onboarding + 2000 topup - 2000 course + 200 bonus = 300
        $this->assertSame(300, $wallet->getBalance($profile));
    }

    public function test_enroll_rejects_full_course(): void
    {
        [$user, $profile, $course] = $this->seedCourse(100, 0, maxSlots: 1);
        $wallet = $this->app->make(WalletService::class);
        $wallet->credit($profile, 200, CoinTransactionType::Topup);

        // Fill the slot with another profile
        $other = Profile::factory()->initial()->forAccount(User::factory()->create())->create();
        CourseEnrollment::create([
            'profile_id' => $other->id, 'course_id' => $course->id,
            'enrolled_at' => now(), 'coins_paid' => 100, 'bonus_coins_received' => 0,
            'coin_transaction_id' => 1,
        ]);

        $token = $this->tokenFor($user);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/enroll")
            ->assertStatus(422);
    }

    public function test_booking_requires_commitment_met(): void
    {
        [$user, $profile, $course] = $this->seedCourse(100, 0);
        $wallet = $this->app->make(WalletService::class);
        $wallet->credit($profile, 200, CoinTransactionType::Topup);

        $token = $this->tokenFor($user);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/enroll")->assertCreated();

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
        [$user, $profile, $course] = $this->seedCourse(100, 0);
        $wallet = $this->app->make(WalletService::class);
        $wallet->credit($profile, 500, CoinTransactionType::Topup);

        $token = $this->tokenFor($user);
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/courses/{$course->id}/enroll")->assertCreated();

        // Simulate required full tests
        $exam = Exam::create(['slug' => 'e1', 'title' => 'E', 'total_duration_minutes' => 60, 'is_published' => true]);
        $version = ExamVersion::create(['exam_id' => $exam->id, 'version_number' => 1, 'is_active' => true]);
        for ($i = 0; $i < $course->required_full_tests; $i++) {
            ExamSession::create([
                'profile_id' => $profile->id, 'exam_version_id' => $version->id,
                'mode' => 'full', 'selected_skills' => ['listening', 'reading', 'writing', 'speaking'],
                'is_full_test' => true, 'started_at' => now(), 'server_deadline_at' => now()->addHour(),
                'submitted_at' => $course->start_date->addDays($course->exam_cooldown_days + 1),
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

    private function seedCourse(int $price, int $bonus, int $maxSlots = 20): array
    {
        $teacher = User::factory()->teacher()->create();
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();

        $course = Course::create([
            'slug' => 'crash-'.now()->timestamp, 'title' => 'Crash Course',
            'target_level' => 'B2', 'price_coins' => $price, 'bonus_coins' => $bonus,
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
