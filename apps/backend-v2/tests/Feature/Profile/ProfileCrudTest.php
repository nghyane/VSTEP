<?php

declare(strict_types=1);

namespace Tests\Feature\Profile;

use App\Enums\CoinTransactionType;
use App\Models\CoinTransaction;
use App\Models\Profile;
use App\Models\SystemConfig;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
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

        // Profile thứ 2 KHÔNG nhận onboarding bonus.
        $newProfile = Profile::where('nickname', 'second-profile')->first();
        $this->assertNotNull($newProfile);
        $bonus = CoinTransaction::query()
            ->where('profile_id', $newProfile->id)
            ->where('type', CoinTransactionType::OnboardingBonus)
            ->first();
        $this->assertNull($bonus);
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

    public function test_avatar_update_only_changes_active_profile(): void
    {
        $user = User::factory()->create();
        $firstProfile = Profile::factory()->initial()->forAccount($user)->create(['avatar_key' => 'Alex']);
        $secondProfile = Profile::factory()->forAccount($user)->create(['avatar_key' => 'Jordan']);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $token = $login->json('data.access_token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson('/api/v1/me/avatar', ['avatar_key' => 'Taylor']);

        $response->assertOk();
        $response->assertJsonPath('data.avatar_key', 'Taylor');
        $this->assertSame('Taylor', $firstProfile->refresh()->avatar_key);
        $this->assertSame('Jordan', $secondProfile->refresh()->avatar_key);
    }

    // ═══════════════════════════════════════════════════════
    // Profile limit: admin-configurable max profiles per user
    // ═══════════════════════════════════════════════════════

    public function test_cannot_create_more_than_five_profiles(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();

        // Create 4 more (total = 5)
        for ($i = 2; $i <= 5; $i++) {
            Profile::factory()->forAccount($user)->create(['nickname' => "profile-{$i}"]);
        }

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $token = $login->json('data.access_token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/profiles', [
                'nickname' => 'profile-6',
                'target_level' => 'B2',
                'target_deadline' => now()->addYear()->toDateString(),
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['profile']);
    }

    public function test_profile_limit_uses_system_config(): void
    {
        SystemConfig::set('profile.max_profiles_per_account', 2);

        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        Profile::factory()->forAccount($user)->create(['nickname' => 'profile-2']);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $token = $login->json('data.access_token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/profiles', [
                'nickname' => 'profile-3',
                'target_level' => 'B2',
                'target_deadline' => now()->addYear()->toDateString(),
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['profile']);
    }

    // ═══════════════════════════════════════════════════════
    // Target level immutable
    // ═══════════════════════════════════════════════════════

    public function test_cannot_change_target_level_after_create(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create(['target_level' => 'B1']);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $token = $login->json('data.access_token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/v1/profiles/{$profile->id}", [
                'target_level' => 'C1',
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['target_level']);
        $this->assertSame('B1', $profile->fresh()->target_level);
    }

    public function test_cannot_change_entry_level_after_create(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create(['entry_level' => 'A2']);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $token = $login->json('data.access_token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/v1/profiles/{$profile->id}", [
                'entry_level' => 'B1',
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['entry_level']);
        $this->assertSame('A2', $profile->fresh()->entry_level);
    }

    // ═══════════════════════════════════════════════════════
    // Deadline: chỉ dời xa hơn
    // ═══════════════════════════════════════════════════════

    public function test_can_extend_deadline(): void
    {
        $user = User::factory()->create();
        $originalDeadline = now()->addMonths(3)->toDateString();
        $profile = Profile::factory()->initial()->forAccount($user)->create([
            'target_deadline' => $originalDeadline,
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $token = $login->json('data.access_token');

        $newDeadline = now()->addYear()->toDateString();
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/v1/profiles/{$profile->id}", [
                'target_deadline' => $newDeadline,
            ]);

        $response->assertOk();
        $response->assertJsonPath('data.target_deadline', $newDeadline);
    }

    public function test_cannot_shorten_deadline(): void
    {
        $user = User::factory()->create();
        $originalDeadline = now()->addYear()->toDateString();
        $profile = Profile::factory()->initial()->forAccount($user)->create([
            'target_deadline' => $originalDeadline,
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $token = $login->json('data.access_token');

        $shorterDeadline = now()->addMonths(3)->toDateString();
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/v1/profiles/{$profile->id}", [
                'target_deadline' => $shorterDeadline,
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['target_deadline']);
        $this->assertSame($originalDeadline, $profile->fresh()->target_deadline->toDateString());
    }

    public function test_avatar_update_keeps_uploaded_file_used_by_sibling_profile(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('avatars/shared.png', 'image');
        $sharedUrl = Storage::disk('public')->url('avatars/shared.png');

        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create(['avatar_url' => $sharedUrl]);
        $secondProfile = Profile::factory()->forAccount($user)->create(['avatar_url' => $sharedUrl]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $token = $login->json('data.access_token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson('/api/v1/me/avatar', ['avatar_key' => 'Taylor'])
            ->assertOk();

        Storage::disk('public')->assertExists('avatars/shared.png');
        $this->assertSame($sharedUrl, $secondProfile->refresh()->avatar_url);
    }
}
