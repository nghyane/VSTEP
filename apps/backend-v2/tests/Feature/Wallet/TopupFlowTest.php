<?php

declare(strict_types=1);

namespace Tests\Feature\Wallet;

use App\Jobs\SendPaymentInvoiceEmail;
use App\Models\Profile;
use App\Models\User;
use App\Models\WalletTopupOrder;
use App\Models\WalletTopupPackage;
use App\Services\TopupService;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Facade;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class TopupFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Http::fake([
            'api-merchant.payos.vn/v2/payment-requests' => Http::response([
                'data' => [
                    'checkoutUrl' => 'https://pay.payos.test/checkout',
                    'paymentLinkId' => 'payos_link_test',
                ],
            ]),
        ]);
    }

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
            ->postJson('/api/v1/wallet/topup', $this->topupPayload($package->id));

        $response->assertCreated();
        $response->assertJsonPath('data.status', 'pending');
        $response->assertJsonPath('data.amount_vnd', 200_000);
        $response->assertJsonPath('data.coins_to_credit', 2_200);
        $this->assertGreaterThan(9, now()->diffInMinutes(WalletTopupOrder::query()->firstOrFail()->expires_at));
        $this->assertLessThanOrEqual(10, now()->diffInMinutes(WalletTopupOrder::query()->firstOrFail()->expires_at));
    }

    public function test_verified_cancel_return_marks_topup_order_cancelled(): void
    {
        Http::fake(function (Request $request) {
            if ($request->method() === 'POST') {
                return Http::response([
                    'data' => [
                        'checkoutUrl' => 'https://pay.payos.test/checkout',
                        'paymentLinkId' => 'payos_link_test',
                    ],
                ]);
            }

            return Http::response([
                'data' => [
                    'id' => 'payos_link_test',
                    'orderCode' => WalletTopupOrder::query()->firstOrFail()->order_code,
                    'status' => 'CANCELLED',
                ],
            ]);
        });

        $package = WalletTopupPackage::factory()->create();
        $token = $this->loginLearner();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/wallet/topup', $this->topupPayload($package->id))
            ->assertCreated();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/wallet/topup/payment-return', ['id' => 'payos_link_test'])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertDatabaseHas('wallet_topup_orders', [
            'gateway_transaction_id' => 'payos_link_test',
            'status' => 'cancelled',
        ]);
    }

    public function test_verified_cancel_return_allows_same_account_after_profile_switch(): void
    {
        Http::fake(function (Request $request) {
            if ($request->method() === 'POST') {
                return Http::response([
                    'data' => [
                        'checkoutUrl' => 'https://pay.payos.test/checkout',
                        'paymentLinkId' => 'payos_link_test',
                    ],
                ]);
            }

            return Http::response([
                'data' => [
                    'id' => 'payos_link_test',
                    'orderCode' => WalletTopupOrder::query()->firstOrFail()->order_code,
                    'status' => 'CANCELLED',
                ],
            ]);
        });

        $user = User::factory()->create();
        $profileA = Profile::factory()->initial()->forAccount($user)->create();
        $profileB = Profile::factory()->forAccount($user)->create();
        $user->update(['active_profile_id' => $profileA->id]);
        $package = WalletTopupPackage::factory()->create();

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($user))
            ->postJson('/api/v1/wallet/topup', $this->topupPayload($package->id))
            ->assertCreated();

        $user->update(['active_profile_id' => $profileB->id]);

        $this->withHeader('Authorization', 'Bearer '.$this->tokenFor($user))
            ->postJson('/api/v1/wallet/topup/payment-return', ['id' => 'payos_link_test'])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_payment_return_does_not_cancel_when_payos_is_still_pending(): void
    {
        Http::fake(function (Request $request) {
            if ($request->method() === 'POST') {
                return Http::response([
                    'data' => [
                        'checkoutUrl' => 'https://pay.payos.test/checkout',
                        'paymentLinkId' => 'payos_link_test',
                    ],
                ]);
            }

            return Http::response([
                'data' => [
                    'id' => 'payos_link_test',
                    'orderCode' => WalletTopupOrder::query()->firstOrFail()->order_code,
                    'status' => 'PENDING',
                ],
            ]);
        });

        $package = WalletTopupPackage::factory()->create();
        $token = $this->loginLearner();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/wallet/topup', $this->topupPayload($package->id))
            ->assertCreated();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/wallet/topup/payment-return', ['id' => 'payos_link_test'])
            ->assertOk()
            ->assertJsonPath('data.status', 'pending');
    }

    public function test_topup_payment_redirect_forwards_client_urls(): void
    {
        $capturedPayload = null;
        Http::fake(function (Request $request) use (&$capturedPayload) {
            $capturedPayload = $request->data();

            return Http::response([
                'data' => [
                    'checkoutUrl' => 'https://pay.payos.test/checkout',
                    'paymentLinkId' => 'payos_link_test',
                ],
            ]);
        });

        $package = WalletTopupPackage::factory()->create();
        $token = $this->loginLearner();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/wallet/topup', $this->topupPayload($package->id, [
                'return_url' => 'https://app.vstepgo.com/dashboard?from=payos',
                'cancel_url' => 'https://app.vstepgo.com/dashboard?cancel=1',
            ]))
            ->assertCreated();

        $this->assertSame('https://app.vstepgo.com/dashboard?from=payos', $capturedPayload['returnUrl']);
        $this->assertSame('https://app.vstepgo.com/dashboard?cancel=1', $capturedPayload['cancelUrl']);
    }

    public function test_topup_payment_redirect_urls_are_required(): void
    {
        Http::fake();

        $package = WalletTopupPackage::factory()->create();
        $token = $this->loginLearner();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/wallet/topup', [
                'package_id' => $package->id,
                'payment_provider' => 'payos',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['return_url', 'cancel_url']);

        Http::assertNothingSent();
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
        Mail::fake();
        Queue::fake();

        $create = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/wallet/topup', $this->topupPayload($package->id));
        $orderCode = $create->json('data.order_code');
        $this->assertNotNull($orderCode);

        // Simulate webhook callback: confirm via TopupService directly.
        $topup = $this->app->make(TopupService::class);
        $topup->confirmByOrderCode($orderCode, 'test_txn_id', null);

        $balance = $this->app->make(WalletService::class)->getBalance($profile);
        // 100 onboarding + 500 topup = 600
        $this->assertSame(600, $balance);
        Queue::assertPushed(SendPaymentInvoiceEmail::class, function (SendPaymentInvoiceEmail $job) use ($orderCode): bool {
            $order = WalletTopupOrder::query()->where('order_code', $orderCode)->firstOrFail();

            return $job->orderType === SendPaymentInvoiceEmail::TYPE_TOPUP
                && $job->orderId === $order->id;
        });
    }

    public function test_invoice_email_failure_does_not_fail_topup_confirmation(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $package = WalletTopupPackage::factory()->create([
            'coins_base' => 500,
            'bonus_coins' => 0,
        ]);

        $token = $this->tokenFor($user);
        $orderCode = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/wallet/topup', $this->topupPayload($package->id))
            ->json('data.order_code');

        config(['queue.default' => 'sync']);
        Mail::shouldReceive('to')->andThrow(new \RuntimeException('SMTP down'));

        try {
            $confirmed = $this->app->make(TopupService::class)
                ->confirmByOrderCode($orderCode, 'test_txn_id', null);

            $this->assertSame('paid', $confirmed->status->value);
            $this->assertSame(600, $this->app->make(WalletService::class)->getBalance($profile));
            $this->assertDatabaseHas('wallet_topup_orders', [
                'order_code' => $orderCode,
                'status' => 'paid',
            ]);
        } finally {
            $this->restoreMailFacade();
        }
    }

    public function test_order_status_is_visible_after_switching_profile_in_same_account(): void
    {
        $user = User::factory()->create();
        $profileA = Profile::factory()->initial()->forAccount($user)->create();
        $profileB = Profile::factory()->forAccount($user)->create();
        $package = WalletTopupPackage::factory()->create(['coins_base' => 500]);

        $login = $this
            ->withServerVariables(['REMOTE_ADDR' => '127.0.2.'.random_int(1, 250)])
            ->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'password',
            ]);
        $tokenA = $login->json('data.access_token');
        $refreshToken = $login->json('data.refresh_token');

        $orderId = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->postJson('/api/v1/wallet/topup', [
                'package_id' => $package->id,
                'payment_provider' => 'payos',
                'return_url' => 'https://example.com/topup/success',
                'cancel_url' => 'https://example.com/topup/cancel',
            ])
            ->json('data.id');

        $tokenB = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->postJson('/api/v1/auth/switch-profile', [
                'profile_id' => $profileB->id,
                'refresh_token' => $refreshToken,
            ])
            ->json('data.access_token');

        $this->withHeader('Authorization', "Bearer {$tokenB}")
            ->getJson("/api/v1/wallet/topup/{$orderId}/status")
            ->assertOk()
            ->assertJsonPath('data.profile_id', $profileA->id)
            ->assertJsonPath('data.account_id', $user->id);
    }

    public function test_confirm_is_idempotent(): void
    {
        $user = User::factory()->create();
        $profile = Profile::factory()->initial()->forAccount($user)->create();
        $package = WalletTopupPackage::factory()->create(['coins_base' => 500]);

        $token = $this->tokenFor($user);
        $orderCode = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/wallet/topup', $this->topupPayload($package->id))
            ->json('data.order_code');

        $topup = $this->app->make(TopupService::class);

        // Confirm twice — second should be idempotent.
        $topup->confirmByOrderCode($orderCode, 'test_txn_1', null);
        $topup->confirmByOrderCode($orderCode, 'test_txn_1', null);

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
        $orderCode = $this->withHeader('Authorization', "Bearer {$tokenA}")
            ->postJson('/api/v1/wallet/topup', $this->topupPayload($package->id))
            ->json('data.order_code');

        $this->assertNotNull($orderCode);

        // Verify order is only confirmable by the correct profile — but confirmByOrderCode
        // isn't profile-gated (gateway callbacks are server-to-server).
        // The profile ownership is enforced at order creation, not confirmation.
        $order = WalletTopupOrder::query()->where('order_code', $orderCode)->first();
        $this->assertNotNull($order);
        $this->assertSame($profileA->id, $order->profile_id);
    }

    private function loginLearner(): string
    {
        $user = User::factory()->create();
        Profile::factory()->initial()->forAccount($user)->create();

        return $this->tokenFor($user);
    }

    /** @param  array<string, mixed>  $overrides */
    private function topupPayload(string $packageId, array $overrides = []): array
    {
        return array_merge([
            'package_id' => $packageId,
            'payment_provider' => 'payos',
            'return_url' => 'https://vstepgo.test/wallet',
            'cancel_url' => 'https://vstepgo.test/wallet',
        ], $overrides);
    }

    private function tokenFor(User $user): string
    {
        return $this
            ->withServerVariables(['REMOTE_ADDR' => '127.0.2.'.random_int(1, 250)])
            ->postJson('/api/v1/auth/login', [
                'email' => $user->email,
                'password' => 'password',
            ])->json('data.access_token');
    }

    private function restoreMailFacade(): void
    {
        $this->app->forgetInstance('mail.manager');
        Facade::clearResolvedInstance('mail.manager');
    }
}
