<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

class SwitchProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_switch_profile_reissues_jwt_with_new_active_profile_id(): void
    {
        $user = User::factory()->create();
        $p1 = Profile::factory()->initial()->forAccount($user)->create();
        $p2 = Profile::factory()->forAccount($user)->create();

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $loginResponse->assertOk();
        $token = $loginResponse->json('data.access_token');
        $refresh = $loginResponse->json('data.refresh_token');

        $switchResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/switch-profile', [
                'profile_id' => $p2->id,
                'refresh_token' => $refresh,
            ]);

        $switchResponse->assertOk();
        $switchResponse->assertJsonPath('data.profile.id', $p2->id);

        $newToken = $switchResponse->json('data.access_token');
        $this->assertNotSame($token, $newToken);

        $payload = JWTAuth::setToken($newToken)->getPayload();
        $this->assertSame($p2->id, $payload->get('active_profile_id'));
    }

    public function test_switch_profile_rejects_other_account_profile(): void
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
        $refresh = $login->json('data.refresh_token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/switch-profile', [
                'profile_id' => $otherProfile->id,
                'refresh_token' => $refresh,
            ]);

        $response->assertStatus(422);
    }
}
