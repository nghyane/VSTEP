<?php

declare(strict_types=1);

namespace Tests\Feature\Wallet;

use App\Models\Profile;
use App\Models\User;
use App\Models\WalletTopupOrder;
use App\Models\WalletTopupPackage;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TopupFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_list_topup_packages(): void
    {
        WalletTopupPackage::factory()->create(['label' => 'Gói A', 'display_order' => 1]);
        WalletTopupPackage::factory()->create(['label' => 'Gói B', 'display_order' => 2]);
        WalletTopupPackage::factory()->create(['label' => 'Inactive', 'is_active' => false]);

        $token = $this->loginLearner();
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/wallet/topup-packages');

        $response->assertOk();
        $response->assertJsonCount(2, 'data');
    }

    public function test_create_topup_order_returns_pending(): void
    {
        $package = WalletTopupPackage::factory()->create([
            'amount_vnd' => 200_000,
            'coins_base' => 2_000,
            'bonus_coins' => 200,
        ]);
        $token = $this->loginLearner();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/wallet/topup', ['package_id' => $package->id]);

        $response->assertCreated();
        $response->assertJsonPath('data.status', 'pending');
        $response->assertJsonPath('data.amount_vnd', 200_000);
        $response->assertJsonPath('data.coins_to_credit', 2_200);
    }

    public function test_confirm_topup_credits_coins(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $package = WalletTopupPackage::factory()->create([
            'coins_base' => 500,
            'bonus_coins' => 0,
        ]);

        $token = $this->tokenFor($user);

        $create = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/wallet/topup', ['package_id' => $package->id]);
        $orderId = $create->json('data.id');

        $confirm = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/wallet/topup/{$orderId}/confirm");

        $confirm->assertOk();
        $confirm->assertJsonPath('data.status', 'paid');

        $balance = $this->app->make(WalletService::class)->getBalance($profile);
        // 100 onboarding + 500 topup = 600
        $this->assertSame(600, $balance);
    }

    public function test_confirm_is_idempotent(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $package = WalletTopupPackage::factory()->create(['coins_base' => 500]);

        $token = $this->tokenFor($user);
        $orderId = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/wallet/topup', ['package_id' => $package->id])
            ->json('data.id');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/wallet/topup/{$orderId}/confirm")->assertOk();
        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/v1/wallet/topup/{$orderId}/confirm")->assertOk();

        // Only 1 topup transaction created.
        $this->assertSame(
            1,
            WalletTopupOrder::query()->where('status', 'paid')->count(),
        );
        $this->assertSame(600, $this->app->make(WalletService::class)->getBalance($profile));
    }

    public function test_cannot_confirm_other_profile_order(): void
    {
        $userA = User::factory()->create();
        $profileA = Profile::factory()->initial()->forAccount($userA)->create();
        $package = WalletTopupPackage::factory()->create();

        $tokenA = $this->tokenFor($userA);
        $orderId = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->postJson('/api/v1/wallet/topup', ['package_id' => $package->id])
            ->json('data.id');

        $userB = User::factory()->create();
        Profile::factory()->initial()->forAccount($userB)->create();
        $tokenB = $this->tokenFor($userB);

        $response = $this->withHeader('Authorization', "Bearer {$tokenB}")
            ->postJson("/api/v1/wallet/topup/{$orderId}/confirm");

        $response->assertStatus(403);
    }

    private function loginLearner(): string
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();

        return $this->tokenFor($user);
    }

    private function tokenFor(User $user): string
    {
        return $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->json('data.access_token');
    }
}
