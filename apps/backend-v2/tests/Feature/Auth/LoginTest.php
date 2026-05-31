<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_tokens_with_active_profile(): void
    {
        $user = User::factory()->create([
            'email' => 'learner@example.com',
            'password' => Hash::make('secret123'),
        ]);
        $profile = Profile::factory()->initial()->forAccount($user)->create();

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'learner@example.com',
            'password' => 'secret123',
        ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                'user',
                'profile',
                'access_token',
                'refresh_token',
                'expires_in',
            ],
        ]);
        $response->assertJsonPath('data.profile.id', $profile->id);
    }

    public function test_refresh_persists_resolved_active_profile(): void
    {
        $user = User::factory()->create([
            'email' => 'refresh@example.com',
            'password' => Hash::make('secret123'),
            'active_profile_id' => null,
        ]);
        $profile = Profile::factory()->initial()->forAccount($user)->create();

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'refresh@example.com',
            'password' => 'secret123',
        ]);
        $login->assertOk();

        $user->update(['active_profile_id' => null]);

        $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => $login->json('data.refresh_token'),
        ])
            ->assertOk()
            ->assertJsonPath('data.profile.id', $profile->id);

        $this->assertSame($profile->id, $user->refresh()->active_profile_id);
    }

    public function test_password_login_does_not_require_google_client_id(): void
    {
        config(['services.google.client_id' => null]);

        $user = User::factory()->create([
            'email' => 'learner@example.com',
            'password' => Hash::make('secret123'),
        ]);
        Profile::factory()->initial()->forAccount($user)->create();

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'learner@example.com',
            'password' => 'secret123',
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['data' => ['access_token', 'refresh_token']]);
    }

    public function test_login_admin_returns_null_profile(): void
    {
        User::factory()->admin()->create([
            'email' => 'admin@example.com',
            'password' => Hash::make('secret123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'secret123',
        ]);

        $response->assertOk();
        $response->assertJsonPath('data.profile', null);
    }

    public function test_login_rejects_bad_credentials(): void
    {
        User::factory()->create([
            'email' => 'learner@example.com',
            'password' => Hash::make('secret123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'learner@example.com',
            'password' => 'wrong',
        ]);

        $response->assertStatus(422);
    }
}
