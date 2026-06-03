<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Enums\CoinTransactionType;
use App\Models\CoinTransaction;
use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class RegisterTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_creates_account_and_initial_profile(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'phat@example.com',
            'password' => 'Secret123',
            'full_name' => 'Nguyễn Phát',
            'nickname' => 'phat-b2',
            'target_level' => 'B2',
            'target_deadline' => now()->addMonths(6)->toDateString(),
            'entry_level' => 'A2',
        ]);

        $response->assertCreated();
        $response->assertJsonStructure([
            'data' => [
                'user' => ['id', 'email', 'role'],
                'profile' => ['id', 'nickname', 'target_level', 'target_deadline', 'is_initial_profile'],
                'email_verification_sent',
            ],
        ]);
        $response->assertJsonPath('data.user.email', 'phat@example.com');
        $response->assertJsonPath('data.user.role', 'learner');
        $response->assertJsonPath('data.profile.is_initial_profile', true);
        $response->assertJsonMissingPath('data.access_token');

        $user = User::where('email', 'phat@example.com')->first();
        $this->assertNotNull($user);
        $this->assertNull($user->email_verified_at);
        $this->assertCount(1, $user->profiles);
        $profile = $user->profiles->first();
        $this->assertTrue($profile->is_initial_profile);
        $this->assertSame($profile->id, $user->refresh()->active_profile_id);

        // Onboarding bonus 100 xu cấp tự động.
        $bonus = CoinTransaction::query()
            ->where('profile_id', $profile->id)
            ->where('type', CoinTransactionType::OnboardingBonus)
            ->first();
        $this->assertNotNull($bonus);
        $this->assertSame(100, $bonus->delta);
        $this->assertSame(100, $bonus->balance_after);

        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_unverified_registered_account_cannot_login(): void
    {
        Notification::fake();

        $this->postJson('/api/v1/auth/register', [
            'email' => 'submitter@example.com',
            'password' => 'Secret123',
            'nickname' => 'submitter-b2',
            'target_level' => 'B2',
            'target_deadline' => now()->addMonths(6)->toDateString(),
        ])->assertCreated();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'submitter@example.com',
            'password' => 'Secret123',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email'])
            ->assertJsonFragment([
                'email' => ['Vui lòng xác thực email trước khi đăng nhập.'],
            ]);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'taken@example.com',
            'password' => 'Secret123',
            'nickname' => 'new-profile',
            'target_level' => 'B2',
            'target_deadline' => now()->addMonths(3)->toDateString(),
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_register_rejects_invalid_target_level(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'new@example.com',
            'password' => 'Secret123',
            'nickname' => 'x',
            'target_level' => 'A1',
            'target_deadline' => now()->addMonth()->toDateString(),
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['target_level']);
    }

    public function test_register_rejects_past_deadline(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'past@example.com',
            'password' => 'Secret123',
            'nickname' => 'x',
            'target_level' => 'B2',
            'target_deadline' => now()->subDay()->toDateString(),
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['target_deadline']);
    }
}
