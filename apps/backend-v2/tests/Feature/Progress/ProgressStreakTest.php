<?php

declare(strict_types=1);

namespace Tests\Feature\Progress;

use App\Models\PracticeSession;
use App\Models\Profile;
use App\Models\ProfileDailyActivity;
use App\Models\ProfileStreakState;
use App\Models\User;
use App\Services\ProgressService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProgressStreakTest extends TestCase
{
    use RefreshDatabase;

    public function test_record_practice_creates_daily_activity(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();

        $session = PracticeSession::create([
            'profile_id' => $profile->id, 'module' => 'listening',
            'content_ref_type' => 'test', 'content_ref_id' => $profile->id,
            'started_at' => now()->subMinutes(10), 'ended_at' => now(),
            'duration_seconds' => 600, 'support_levels_used' => [],
        ]);

        $this->app->make(ProgressService::class)->recordPracticeCompletion($session);

        $this->assertSame(1, ProfileDailyActivity::query()
            ->where('profile_id', $profile->id)->count());
    }

    public function test_streak_increments_on_consecutive_days(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $service = $this->app->make(ProgressService::class);

        $day1 = now()->subDay();
        $session1 = PracticeSession::create([
            'profile_id' => $profile->id, 'module' => 'vocab',
            'content_ref_type' => 'test', 'content_ref_id' => $profile->id,
            'started_at' => $day1->copy()->subMinutes(5), 'ended_at' => $day1,
            'duration_seconds' => 300, 'support_levels_used' => [],
        ]);
        $service->recordPracticeCompletion($session1);

        $session2 = PracticeSession::create([
            'profile_id' => $profile->id, 'module' => 'grammar',
            'content_ref_type' => 'test', 'content_ref_id' => $profile->id,
            'started_at' => now()->subMinutes(5), 'ended_at' => now(),
            'duration_seconds' => 300, 'support_levels_used' => [],
        ]);
        $service->recordPracticeCompletion($session2);

        $state = ProfileStreakState::query()->find($profile->id);
        $this->assertSame(2, $state->current_streak);
        $this->assertSame(2, $state->longest_streak);
    }

    public function test_streak_resets_on_gap(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $service = $this->app->make(ProgressService::class);

        $day1 = now()->subDays(3);
        $session1 = PracticeSession::create([
            'profile_id' => $profile->id, 'module' => 'vocab',
            'content_ref_type' => 'test', 'content_ref_id' => $profile->id,
            'started_at' => $day1->copy()->subMinutes(5), 'ended_at' => $day1,
            'duration_seconds' => 300, 'support_levels_used' => [],
        ]);
        $service->recordPracticeCompletion($session1);

        $session2 = PracticeSession::create([
            'profile_id' => $profile->id, 'module' => 'grammar',
            'content_ref_type' => 'test', 'content_ref_id' => $profile->id,
            'started_at' => now()->subMinutes(5), 'ended_at' => now(),
            'duration_seconds' => 300, 'support_levels_used' => [],
        ]);
        $service->recordPracticeCompletion($session2);

        $state = ProfileStreakState::query()->find($profile->id);
        $this->assertSame(1, $state->current_streak);
        $this->assertSame(1, $state->longest_streak);
    }

    public function test_overview_endpoint(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email, 'password' => 'password',
        ])->json('data.access_token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/overview');

        $response->assertOk();
        $response->assertJsonStructure(['data' => [
            'profile' => ['nickname', 'target_level', 'target_deadline'],
            'stats' => ['total_tests', 'total_study_minutes', 'streak'],
            'chart',
        ]]);
        $response->assertJsonPath('data.chart', null); // < min_tests
    }

    public function test_streak_endpoint(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email, 'password' => 'password',
        ])->json('data.access_token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/streak')
            ->assertOk()
            ->assertJsonPath('data.current_streak', 0)
            ->assertJsonPath('data.daily_goal', 1);
    }
}
