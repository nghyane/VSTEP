<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CoinTransactionType;
use App\Models\Profile;
use App\Models\WalletTopupOrder;
use App\Models\WalletTopupPackage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Top-up order lifecycle.
 *
 * Phase 1 payment MOCK:
 * - create order with status=pending
 * - FE call confirm() immediately (no real gateway)
 * - confirm() credits coins + marks paid
 *
 * Real gateway integration (phase 2): provider webhook → confirm.
 */
class TopupService
{
    public function __construct(
        private readonly WalletService $walletService,
        private readonly NotificationService $notificationService,
    ) {}

    public function createOrder(
        Profile $profile,
        WalletTopupPackage $package,
        string $paymentProvider = 'mock',
    ): WalletTopupOrder {
        if (! $package->is_active) {
            throw ValidationException::withMessages([
                'package' => ['Gói này hiện không khả dụng.'],
            ]);
        }

        return WalletTopupOrder::create([
            'profile_id' => $profile->id,
            'package_id' => $package->id,
            'amount_vnd' => $package->amount_vnd,
            'coins_to_credit' => $package->totalCoins(),
            'status' => 'pending',
            'payment_provider' => $paymentProvider,
            'provider_ref' => 'mock_'.Str::random(16),
        ]);
    }

    /**
     * Confirm payment: credit coins atomically.
     * Idempotent: nếu đã paid → return order không tạo tx duplicate.
     */
    public function confirm(WalletTopupOrder $order): WalletTopupOrder
    {
        return DB::transaction(function () use ($order) {
            $locked = WalletTopupOrder::query()
                ->whereKey($order->id)
                ->lockForUpdate()
                ->first();

            if ($locked === null) {
                throw new \RuntimeException('Order not found during confirm.');
            }

            if ($locked->status === 'paid') {
                return $locked;
            }

            if ($locked->status !== 'pending') {
                throw ValidationException::withMessages([
                    'order' => ["Đơn hàng ở trạng thái {$locked->status} không thể xác nhận."],
                ]);
            }

            $this->walletService->credit(
                profile: $locked->profile,
                amount: $locked->coins_to_credit,
                type: CoinTransactionType::Topup,
                source: $locked,
                metadata: [
                    'provider' => $locked->payment_provider,
                    'provider_ref' => $locked->provider_ref,
                ],
            );

            $locked->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            DB::afterCommit(fn () => $this->notificationService->push(
                profile: $locked->profile,
                type: 'topup_completed',
                title: 'Nạp xu thành công',
                body: "Bạn đã nhận {$locked->coins_to_credit} xu.",
                iconKey: 'coin',
                dedupKey: "topup:{$locked->id}",
            ));

            return $locked;
        });
    }
}
