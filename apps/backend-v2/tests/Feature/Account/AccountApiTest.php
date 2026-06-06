<?php

declare(strict_types=1);

namespace Tests\Feature\Account;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

final class AccountApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_account_can_update_phone_number_through_api(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $token = $this->loginToken($user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson('/api/v1/me', [
                'phone_number' => '0343062376',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.phone_number', '0343062376');

        $this->assertSame('0343062376', $user->refresh()->phone_number);
    }

    public function test_login_response_includes_phone_number(): void
    {
        $user = User::factory()->create(['phone_number' => '0343062376']);
        Profile::factory()->initial()->forAccount($user)->create();

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk()
            ->assertJsonPath('data.user.phone_number', '0343062376');
    }

    public function test_account_phone_number_must_be_valid(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $token = $this->loginToken($user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson('/api/v1/me', [
                'phone_number' => '09815674890000',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['phone_number']);
    }

    public function test_account_can_change_password_through_api(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $token = $this->loginToken($user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/me/change-password', [
                'current_password' => 'password',
                'new_password' => 'new-password-123',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.success', true);

        $this->assertTrue(Hash::check('new-password-123', $user->refresh()->password));
    }

    public function test_active_profile_can_choose_avatar_through_api(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create([
            'avatar_url' => 'https://example.test/avatar.png',
            'avatar_key' => null,
        ]);
        $token = $this->loginToken($user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson('/api/v1/me/avatar', [
                'avatar_key' => 'Jordan',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.avatar_key', 'Jordan')
            ->assertJsonPath('data.avatar_url', null);

        $profile->refresh();
        $this->assertSame('Jordan', $profile->avatar_key);
        $this->assertNull($profile->avatar_url);
    }

    private function loginToken(User $user): string
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertOk();

        return (string) $response->json('data.access_token');
    }
}
