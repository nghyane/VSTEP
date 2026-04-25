<?php

declare(strict_types=1);

namespace Tests\Feature\Progress;

use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\ExamVersion;
use App\Models\PracticeSession;
use App\Models\Profile;
use App\Models\ProfileDailyActivity;
use App\Models\ProfileStreakLog;
use App\Models\ProfileStreakState;
use App\Models\User;
use App\Services\ProgressService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ProgressStreakTest extends TestCase
{
    use RefreshDatabase;

    public function test_record_practice_creates_daily_activity_but_not_streak(): void
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
        // Drill KHÔNG drive streak — RFC 0019.
        $this->assertSame(0, ProfileStreakState::query()
            ->where('profile_id', $profile->id)->value('current_streak') ?? 0);
    }

    public function test_streak_increments_on_consecutive_full_tests(): void
    {
        [$profile, $version] = $this->seedExamVersion();
        $service = $this->app->make(ProgressService::class);

        $service->recordExamCompletion($this->createFullTestSession($profile, $version, now()->subDay()));
        $service->recordExamCompletion($this->createFullTestSession($profile, $version, now()));

        $state = ProfileStreakState::query()->find($profile->id);
        $this->assertSame(2, $state->current_streak);
        $this->assertSame(2, $state->longest_streak);
        $this->assertSame(2, ProfileStreakLog::query()
            ->where('profile_id', $profile->id)->count());
    }

    public function test_streak_resets_on_gap(): void
    {
        [$profile, $version] = $this->seedExamVersion();
        $service = $this->app->make(ProgressService::class);

        $service->recordExamCompletion($this->createFullTestSession($profile, $version, now()->subDays(3)));
        $service->recordExamCompletion($this->createFullTestSession($profile, $version, now()));

        $state = ProfileStreakState::query()->find($profile->id);
        $this->assertSame(1, $state->current_streak);
        $this->assertSame(1, $state->longest_streak);
    }

    public function test_custom_exam_does_not_increment_streak(): void
    {
        [$profile, $version] = $this->seedExamVersion();
        $service = $this->app->make(ProgressService::class);

        $session = ExamSession::create([
            'profile_id' => $profile->id,
            'exam_version_id' => $version->id,
            'mode' => 'custom',
            'selected_skills' => ['listening'],
            'is_full_test' => false,
            'time_extension_factor' => 1.0,
            'started_at' => now()->subHour(),
            'server_deadline_at' => now()->addHour(),
            'submitted_at' => now(),
            'status' => 'submitted',
            'coins_charged' => 8,
        ]);

        $service->recordExamCompletion($session);

        $this->assertNull(ProfileStreakState::query()->find($profile->id));
    }

    public function test_streak_endpoint_returns_today_full_test_count(): void
    {
        [$profile, $version] = $this->seedExamVersion();
        $this->createFullTestSession($profile, $version, now());
        $this->createFullTestSession($profile, $version, now()->subMinutes(30));

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $profile->user->email, 'password' => 'password',
        ])->json('data.access_token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/streak')
            ->assertOk()
            ->assertJsonPath('data.daily_goal', 1)
            ->assertJsonPath('data.today_sessions', 2);
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
            'profile' => ['nickname', 'target_level', 'target_deadline', 'entry_level', 'predicted_level'],
            'stats' => ['total_tests', 'total_study_minutes', 'streak'],
            'chart',
        ]]);
        $response->assertJsonPath('data.chart', null); // < min_tests
        // chart=null → predicted_level fallback = entry_level (RFC 0019 amendment 2026-04-25)
        $response->assertJsonPath(
            'data.profile.predicted_level',
            $response->json('data.profile.entry_level'),
        );
    }

    /**
     * @return array{0: Profile, 1: ExamVersion}
     */
    private function seedExamVersion(): array
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();

        $exam = Exam::create([
            'slug' => 'vstep-streak-test', 'title' => 'Streak Test', 'total_duration_minutes' => 60,
            'is_published' => true,
        ]);
        $version = ExamVersion::create([
            'exam_id' => $exam->id, 'version_number' => 1, 'is_active' => true,
            'published_at' => now(),
        ]);

        return [$profile, $version];
    }

    private function createFullTestSession(Profile $profile, ExamVersion $version, Carbon $submittedAt): ExamSession
    {
        return ExamSession::create([
            'profile_id' => $profile->id,
            'exam_version_id' => $version->id,
            'mode' => 'full',
            'selected_skills' => ['listening', 'reading', 'writing', 'speaking'],
            'is_full_test' => true,
            'time_extension_factor' => 1.0,
            'started_at' => $submittedAt->copy()->subHour(),
            'server_deadline_at' => $submittedAt->copy()->addHour(),
            'submitted_at' => $submittedAt,
            'status' => 'submitted',
            'coins_charged' => 25,
        ]);
    }
}
