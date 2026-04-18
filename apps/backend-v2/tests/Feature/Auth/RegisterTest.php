<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegisterTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_creates_account_and_initial_profile(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'phat@example.com',
            'password' => 'secret123',
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
            ],
        ]);
        $response->assertJsonPath('data.user.email', 'phat@example.com');
        $response->assertJsonPath('data.user.role', 'learner');
        $response->assertJsonPath('data.profile.is_initial_profile', true);

        $user = User::where('email', 'phat@example.com')->first();
        $this->assertNotNull($user);
        $this->assertCount(1, $user->profiles);
        $this->assertTrue($user->profiles->first()->is_initial_profile);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $response = $this->postJson('/api/v1/auth/register', [
            'email' => 'taken@example.com',
            'password' => 'secret123',
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
            'password' => 'secret123',
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
            'password' => 'secret123',
            'nickname' => 'x',
            'target_level' => 'B2',
            'target_deadline' => now()->subDay()->toDateString(),
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['target_deadline']);
    }
}
