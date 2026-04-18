<?php

declare(strict_types=1);

namespace Tests\Feature\Middleware;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleHierarchyTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_teacher_guarded_route(): void
    {
        $admin = User::factory()->admin()->create();
        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $admin->email,
            'password' => 'password',
        ]);
        $token = $login->json('data.access_token');

        // admin should see own me endpoint (role hierarchy holds since admin.level >= any)
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me');

        $response->assertOk();
        $response->assertJsonPath('data.user.role', 'admin');
        $response->assertJsonPath('data.profile', null);
    }

    public function test_me_endpoint_returns_profile_for_learner(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $token = $login->json('data.access_token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me');

        $response->assertOk();
        $response->assertJsonPath('data.profile.id', $profile->id);
    }
}
