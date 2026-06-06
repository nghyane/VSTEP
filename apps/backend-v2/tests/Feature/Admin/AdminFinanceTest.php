<?php

declare(strict_types=1);

namespace Tests\Feature\Admin;

use App\Enums\CoinTransactionType;
use App\Enums\OrderStatus;
use App\Models\CoinTransaction;
use App\Models\Course;
use App\Models\CourseEnrollmentOrder;
use App\Models\Profile;
use App\Models\User;
use App\Models\WalletTopupOrder;
use App\Models\WalletTopupPackage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminFinanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_finance_summary_orders_and_top_products(): void
    {
        [$token, $topupOrder, $courseOrder] = $this->seedPaidOrders();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/finance/summary')
            ->assertOk()
            ->assertJsonPath('data.revenue.total', 1_600_000)
            ->assertJsonPath('data.revenue.topup_total', 100_000)
            ->assertJsonPath('data.revenue.course_total', 1_500_000)
            ->assertJsonPath('data.orders.paid', 2)
            ->assertJsonPath('data.sources.topup.orders', 1)
            ->assertJsonPath('data.sources.course.orders', 1);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/finance/orders')
            ->assertOk()
            ->assertJsonPath('meta.total', 2);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/finance/orders?type=course')
            ->assertOk()
            ->assertJsonPath('data.0.id', $courseOrder->id)
            ->assertJsonPath('data.0.type', 'course')
            ->assertJsonPath('meta.total', 1);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/finance/orders?type=unknown')
            ->assertUnprocessable();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/admin/finance/orders/topup/{$topupOrder->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $topupOrder->id)
            ->assertJsonPath('data.type', 'topup')
            ->assertJsonPath('data.coins_to_credit', 120);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/finance/top-products')
            ->assertOk()
            ->assertJsonPath('data.topup.0.revenue_vnd', 100_000)
            ->assertJsonPath('data.course.0.revenue_vnd', 1_500_000);
    }

    public function test_finance_coin_summary_and_transactions(): void
    {
        $admin = User::factory()->admin()->create();
        $token = $this->withServerVariables(['REMOTE_ADDR' => '127.0.4.'.random_int(1, 250)])
            ->postJson('/api/v1/auth/login', [
                'email' => $admin->email,
                'password' => 'password',
            ])->json('data.access_token');
        $user = User::factory()->create(['full_name' => 'Learner Coin', 'email' => 'coin@example.test']);
        $profile = Profile::factory()->initial()->forAccount($user)->create(['nickname' => 'Coin Profile']);

        CoinTransaction::create([
            'account_id' => $user->id,
            'profile_id' => $profile->id,
            'type' => CoinTransactionType::Topup,
            'delta' => 100,
            'balance_after' => 100,
            'source_type' => 'wallet_topup_order',
            'source_id' => 'source-topup',
        ]);
        CoinTransaction::create([
            'account_id' => $user->id,
            'profile_id' => $profile->id,
            'type' => CoinTransactionType::ExamFull,
            'delta' => -30,
            'balance_after' => 70,
            'source_type' => 'practice_session',
            'source_id' => 'source-exam',
        ]);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/finance/coin-summary')
            ->assertOk()
            ->assertJsonPath('data.totals.transactions', 2)
            ->assertJsonPath('data.totals.credit_total', 100)
            ->assertJsonPath('data.totals.debit_total', 30)
            ->assertJsonPath('data.totals.net_total', 70)
            ->assertJsonPath('data.totals.active_users', 1);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/finance/coin-transactions?q=coin@example.test&direction=debit')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.type', 'exam_full')
            ->assertJsonPath('data.0.delta', -30)
            ->assertJsonPath('data.0.user.email', 'coin@example.test')
            ->assertJsonPath('data.0.profile.nickname', 'Coin Profile');
    }

    /** @return array{string, WalletTopupOrder, CourseEnrollmentOrder} */
    private function seedPaidOrders(): array
    {
        $admin = User::factory()->admin()->create();
        $token = $this->withServerVariables(['REMOTE_ADDR' => '127.0.3.'.random_int(1, 250)])
            ->postJson('/api/v1/auth/login', [
                'email' => $admin->email,
                'password' => 'password',
            ])->json('data.access_token');

        $profile = Profile::factory()->initial()->forAccount(User::factory()->create())->create();
        $package = WalletTopupPackage::create([
            'label' => 'Starter',
            'amount_vnd' => 100_000,
            'coins_base' => 100,
            'bonus_coins' => 20,
            'display_order' => 1,
            'is_active' => true,
            'is_best_value' => false,
        ]);
        $course = Course::factory()->create(['title' => 'B2 Intensive', 'price_vnd' => 1_500_000]);

        $topupOrder = WalletTopupOrder::create([
            'account_id' => $profile->account_id,
            'profile_id' => $profile->id,
            'package_id' => $package->id,
            'order_code' => 900001,
            'amount_vnd' => 100_000,
            'coins_to_credit' => 120,
            'status' => OrderStatus::Paid,
            'payment_provider' => 'payos',
            'paid_at' => now(),
        ]);
        $courseOrder = CourseEnrollmentOrder::create([
            'profile_id' => $profile->id,
            'course_id' => $course->id,
            'order_code' => 900002,
            'amount_vnd' => 1_500_000,
            'status' => OrderStatus::Paid,
            'payment_provider' => 'payos',
            'paid_at' => now(),
        ]);

        return [$token, $topupOrder, $courseOrder];
    }
}
