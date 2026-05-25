<?php

declare(strict_types=1);

namespace Tests\Feature\Notification;

use App\Models\Notification;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_profile_can_mark_its_notification_as_read(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $notification = $this->notification($profile);
        $token = $this->loginToken($user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/notifications/{$notification->id}/read");

        $response->assertOk();
        $response->assertJsonPath('data.marked', true);
        $this->assertNotNull($notification->refresh()->read_at);
    }

    public function test_active_profile_cannot_mark_other_profile_notification_as_read(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();
        $otherProfile = Profile::factory()->forAccount($user)->create();
        $notification = $this->notification($otherProfile);
        $token = $this->loginToken($user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/notifications/{$notification->id}/read");

        $response->assertForbidden();
        $this->assertNull($notification->refresh()->read_at);
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

    private function notification(Profile $profile): Notification
    {
        return Notification::create([
            'profile_id' => $profile->id,
            'type' => 'system',
            'title' => 'Thông báo kiểm thử',
            'icon_key' => 'info',
        ]);
    }
}
