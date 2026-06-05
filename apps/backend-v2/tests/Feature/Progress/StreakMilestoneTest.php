<?php

declare(strict_types=1);

namespace Tests\Feature\Progress;

use App\Models\Profile;
use App\Models\ProfileDailyActivity;
use App\Models\SystemConfig;
use App\Models\User;
use App\Services\StreakMilestoneService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class StreakMilestoneTest extends TestCase
{
    use RefreshDatabase;

    private Profile $profile;

    private StreakMilestoneService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::factory()->create();
        $this->profile = Profile::factory()->initial()->forAccount($user)->create();
        $this->service = $this->app->make(StreakMilestoneService::class);

        SystemConfig::set('streak.milestones', [
            ['days' => 7, 'coins' => 100],
            ['days' => 14, 'coins' => 250],
        ]);
    }

    public function test_claim_success_credits_coins(): void
    {
        $this->seedStreakState(7);

        $result = $this->service->claim($this->profile, 7);

        $this->assertSame(7, $result['milestone_days']);
        $this->assertSame(100, $result['coins_granted']);
        $this->assertGreaterThanOrEqual(100, $result['balance_after']);
        $this->assertNotNull($result['claimed_at']);
    }

    public function test_claim_duplicate_is_rejected(): void
    {
        $this->seedStreakState(7);

        $this->service->claim($this->profile, 7);

        $this->expectException(ValidationException::class);
        $this->service->claim($this->profile, 7);
    }

    public function test_claim_duplicate_is_rejected_across_profiles_in_same_account(): void
    {
        $sibling = Profile::factory()->forAccount($this->profile->account)->create();
        $this->seedStreakState(7, $this->profile);
        $this->seedStreakState(7, $sibling);

        $this->service->claim($this->profile, 7);

        $milestones = $this->service->listForProfile($sibling);
        $this->assertTrue($milestones[0]['claimed']);

        $this->expectException(ValidationException::class);
        $this->service->claim($sibling, 7);
    }

    public function test_different_accounts_can_claim_same_milestone(): void
    {
        $otherUser = User::factory()->create();
        $otherProfile = Profile::factory()->initial()->forAccount($otherUser)->create();
        $this->seedStreakState(7, $this->profile);
        $this->seedStreakState(7, $otherProfile);

        $first = $this->service->claim($this->profile, 7);
        $second = $this->service->claim($otherProfile, 7);

        $this->assertSame(100, $first['coins_granted']);
        $this->assertSame(100, $second['coins_granted']);
    }

    public function test_claim_fails_when_streak_insufficient(): void
    {
        $this->seedStreakState(5);

        $this->expectException(ValidationException::class);
        $this->service->claim($this->profile, 7);
    }

    public function test_claim_fails_for_nonexistent_milestone(): void
    {
        $this->seedStreakState(30);

        $this->expectException(ValidationException::class);
        $this->service->claim($this->profile, 99);
    }

    private function seedStreakState(int $streak, ?Profile $profile = null): void
    {
        $profile ??= $this->profile;

        for ($i = $streak - 1; $i >= 0; $i--) {
            ProfileDailyActivity::query()->insert([
                'profile_id' => $profile->id,
                'date_local' => now()->subDays($i)->toDateString(),
            ]);
        }
    }
}
