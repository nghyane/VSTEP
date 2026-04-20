<?php

declare(strict_types=1);

namespace Tests\Feature\Wallet;

use App\Models\Profile;
use App\Models\PromoCode;
use App\Models\PromoCodeRedemption;
use App\Models\User;
use App\Services\PromoService;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PromoRedeemTest extends TestCase
{
    use RefreshDatabase;

    public function test_redeem_credits_coins_and_logs_redemption(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $promo = PromoCode::factory()->create([
            'code' => 'WELCOME',
            'amount_coins' => 100,
        ]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $token = $login->json('data.access_token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/wallet/promo-redeem', ['code' => 'welcome']);

        $response->assertOk();
        $response->assertJsonPath('data.coins_granted', 100);

        $this->assertDatabaseHas('promo_code_redemptions', [
            'promo_code_id' => $promo->id,
            'account_id' => $user->id,
            'profile_id' => $profile->id,
            'coins_granted' => 100,
        ]);

        $balance = $this->app->make(WalletService::class)->getBalance($profile);
        // 100 onboarding + 100 promo = 200
        $this->assertSame(200, $balance);
    }

    public function test_redeem_rejects_invalid_code(): void
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $token = $login->json('data.access_token');

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/wallet/promo-redeem', ['code' => 'NOPE']);

        $response->assertStatus(422);
    }

    public function test_redeem_rejects_duplicate_for_same_account(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        PromoCode::factory()->create(['code' => 'ONCE', 'amount_coins' => 50, 'per_account_limit' => 1]);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);
        $token = $login->json('data.access_token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/wallet/promo-redeem', ['code' => 'ONCE'])
            ->assertOk();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/wallet/promo-redeem', ['code' => 'ONCE'])
            ->assertStatus(422);

        $this->assertSame(1, PromoCodeRedemption::count());
    }

    public function test_redeem_respects_total_uses_limit(): void
    {
        $promo = PromoCode::factory()->create([
            'code' => 'LIMITED',
            'amount_coins' => 20,
            'max_total_uses' => 1,
        ]);

        $userA = User::factory()->create();
        $profileA = Profile::factory()->initial()->forAccount($userA)->create();
        $userB = User::factory()->create();
        $profileB = Profile::factory()->initial()->forAccount($userB)->create();

        $service = $this->app->make(PromoService::class);
        $service->redeem($userA, $profileA, 'LIMITED');

        $this->expectException(ValidationException::class);
        $service->redeem($userB, $profileB, 'LIMITED');
    }
}
