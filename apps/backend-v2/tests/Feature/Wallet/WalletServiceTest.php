<?php

declare(strict_types=1);

namespace Tests\Feature\Wallet;

use App\Enums\CoinTransactionType;
use App\Models\CoinTransaction;
use App\Models\Profile;
use App\Models\User;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class WalletServiceTest extends TestCase
{
    use RefreshDatabase;

    private WalletService $wallet;

    protected function setUp(): void
    {
        parent::setUp();
        $this->wallet = $this->app->make(WalletService::class);
    }

    public function test_balance_is_zero_for_new_profile(): void
    {
        $profile = $this->profile();

        $this->assertSame(0, $this->wallet->getBalance($profile));
    }

    public function test_credit_increases_balance(): void
    {
        $profile = $this->profile();

        $this->wallet->credit($profile, 50, CoinTransactionType::AdminGrant);

        $this->assertSame(50, $this->wallet->getBalance($profile));
    }

    public function test_spend_reduces_balance(): void
    {
        $profile = $this->profile();
        $this->wallet->credit($profile, 100, CoinTransactionType::Topup);

        $this->wallet->spend($profile, 25, CoinTransactionType::ExamCustom);

        $this->assertSame(75, $this->wallet->getBalance($profile));
    }

    public function test_spend_rejects_insufficient_balance(): void
    {
        $profile = $this->profile();
        $this->wallet->credit($profile, 10, CoinTransactionType::Topup);

        $this->expectException(ValidationException::class);
        $this->wallet->spend($profile, 25, CoinTransactionType::ExamCustom);

        $this->assertSame(10, $this->wallet->getBalance($profile));
    }

    public function test_credit_rejects_negative_amount(): void
    {
        $profile = $this->profile();

        $this->expectException(\InvalidArgumentException::class);
        $this->wallet->credit($profile, -10, CoinTransactionType::Topup);
    }

    public function test_credit_rejects_debit_type(): void
    {
        $profile = $this->profile();

        $this->expectException(\InvalidArgumentException::class);
        $this->wallet->credit($profile, 10, CoinTransactionType::ExamCustom);
    }

    public function test_spend_rejects_credit_type(): void
    {
        $profile = $this->profile();

        $this->expectException(\InvalidArgumentException::class);
        $this->wallet->spend($profile, 10, CoinTransactionType::Topup);
    }

    public function test_ledger_preserves_history(): void
    {
        $profile = $this->profile();

        $this->wallet->credit($profile, 100, CoinTransactionType::Topup);
        $this->wallet->spend($profile, 25, CoinTransactionType::ExamCustom);
        $this->wallet->credit($profile, 50, CoinTransactionType::PromoRedeem);

        $txs = CoinTransaction::query()
            ->where('profile_id', $profile->id)
            ->orderBy('id')
            ->get();

        $this->assertCount(3, $txs);
        $this->assertSame([100, -25, 50], $txs->pluck('delta')->all());
        $this->assertSame([100, 75, 125], $txs->pluck('balance_after')->all());
    }

    private function profile(): Profile
    {
        return Profile::factory()->forAccount(User::factory()->create())->create();
    }
}
