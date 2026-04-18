<?php

declare(strict_types=1);

namespace Tests\Feature\Profile;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_additional_profile_does_not_set_initial_flag(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $token = $login->json('data.access_token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/profiles', [
                'nickname' => 'second-profile',
                'target_level' => 'C1',
                'target_deadline' => now()->addYear()->toDateString(),
            ]);

        $response->assertCreated();
        $response->assertJsonPath('data.is_initial_profile', false);
        $response->assertJsonPath('data.target_level', 'C1');
    }

    public function test_nickname_must_be_unique_within_account(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create(['nickname' => 'taken']);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $token = $login->json('data.access_token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/profiles', [
                'nickname' => 'taken',
                'target_level' => 'B2',
                'target_deadline' => now()->addMonths(3)->toDateString(),
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['nickname']);
    }

    public function test_cannot_delete_last_profile(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $token = $login->json('data.access_token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/v1/profiles/{$profile->id}");

        $response->assertStatus(422);
    }

    public function test_cannot_view_other_account_profile(): void
    {
        $userA = User::factory()->create();
        Profile::factory()->initial()->forAccount($userA)->create();

        $userB = User::factory()->create();
        $otherProfile = Profile::factory()->initial()->forAccount($userB)->create();

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $userA->email,
            'password' => 'password',
        ]);
        $token = $login->json('data.access_token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/profiles/{$otherProfile->id}");

        $response->assertStatus(403);
    }

    public function test_reset_profile_logs_event(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $token = $login->json('data.access_token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/profiles/{$profile->id}/reset", [
                'reason' => 'Đổi mục tiêu',
            ]);

        $response->assertOk();
        $this->assertDatabaseHas('profile_reset_events', [
            'profile_id' => $profile->id,
            'reason' => 'Đổi mục tiêu',
        ]);
    }
}
