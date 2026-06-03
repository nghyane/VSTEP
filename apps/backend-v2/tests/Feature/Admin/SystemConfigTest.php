<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Models\SystemConfig;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Tests\TestCase;

final class SystemConfigTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_support_zalo_phone(): void
    {
        $admin = User::factory()->admin()->create();

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($admin))
            ->patchJson('/api/v1/admin/system-config/support.zalo_phone', [
                'value' => '090 123-4567',
            ])
            ->assertOk()
            ->assertJsonPath('data.key', 'support.zalo_phone')
            ->assertJsonPath('data.value', '090 123-4567');

        $this->assertSame('090 123-4567', SystemConfig::get('support.zalo_phone'));
    }

    public function test_admin_cannot_update_support_zalo_phone_with_non_phone_text(): void
    {
        $admin = User::factory()->admin()->create();

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($admin))
            ->patchJson('/api/v1/admin/system-config/support.zalo_phone', [
                'value' => 'zalo-user',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('value');

        $this->assertSame('0343062376', SystemConfig::get('support.zalo_phone'));
    }

    private function tokenFor(User $user): string
    {
        return JWTAuth::fromUser($user);
    }
}
