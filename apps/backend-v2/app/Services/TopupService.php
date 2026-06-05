<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CoinTransactionType;
use App\Enums\IconKey;
use App\Enums\NotificationType;
use App\Enums\OrderStatus;
use App\Enums\PaymentProvider;
use App\Jobs\SendPaymentInvoiceEmail;
use App\Models\Profile;
use App\Models\WalletTopupOrder;
use App\Models\WalletTopupPackage;
use App\Services\Payment\OrderNotFoundAfterValidation;
use App\Services\Payment\PaymentGatewayRegistry;
use App\Services\Payment\PayOsGateway;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * Top-up order lifecycle with real payment gateway integration.
 *
 * Flow:
 *   createOrder() → returns order + payment_url
 *   Gateway callback → handleCallback() → validates → credits coins
 *   Expired orders → cleaned up by scheduled job
 */
final class TopupService
{
    public function __construct(
        private readonly WalletService $walletService,
        private readonly NotificationService $notificationService,
        private readonly PaymentGatewayRegistry $gateways,
    ) {}

    /**
     * Create order + generate payment URL.
     *
     * @return array{0: WalletTopupOrder, 1: string} [order, paymentUrl]
     */
    public function createOrder(
        Profile $profile,
        WalletTopupPackage $package,
        PaymentProvider $provider,
        string $returnUrl,
        string $cancelUrl,
    ): array {
        if (! $package->is_active) {
            throw ValidationException::withMessages([
                'package' => ['Gói này hiện không khả dụng.'],
            ]);
        }

        $gateway = $this->gateways->get($provider);
        $expiryMinutes = (int) config('payment.order_expiry_minutes', 15);

        return DB::transaction(function () use ($profile, $package, $provider, $gateway, $expiryMinutes, $returnUrl, $cancelUrl) {
            // Generate unique integer order_code for PayOS.
            $orderCode = $this->nextOrderCode();

            $order = WalletTopupOrder::create([
                'order_code' => $orderCode,
                'account_id' => $profile->account_id,
                'profile_id' => $profile->id,
                'package_id' => $package->id,
                'amount_vnd' => $package->amount_vnd,
                'coins_to_credit' => $package->totalCoins(),
                'status' => OrderStatus::Pending,
                'payment_provider' => $provider->value,
                'expires_at' => now()->addMinutes($expiryMinutes),
            ]);

            $response = $gateway->createPayment($order, $returnUrl, $cancelUrl);

            $order->update([
                'payment_url' => $response->paymentUrl,
                'gateway_transaction_id' => $response->gatewayTransactionId,
                'gateway_response' => $response->rawResponse,
            ]);

            return [$order, $response->paymentUrl];
        });
    }

    /**
     * Handle webhook callback from payment gateway (no auth).
     */
    public function handleCallback(PaymentProvider $provider, array $data): WalletTopupOrder
    {
        $gateway = $this->gateways->get($provider);
        $result = $gateway->validateCallback($data);

        if (! $result->success) {
            $this->markFailed($result->orderCode, $result->rawData);
            Log::warning('Payment callback failed', [
                'provider' => $provider->value,
                'order_code' => $result->orderCode,
                'reason' => $result->failureReason,
            ]);

            throw new \RuntimeException($result->failureReason ?? 'Payment failed');
        }

        return $this->confirmByOrderCode(
            $result->orderCode,
            $result->gatewayTransactionId,
            $result->rawData,
        );
    }

    /**
     * Confirm payment: credit coins atomically.
     * Idempotent: nếu đã paid → return order không tạo duplicate.
     */
    public function confirmByOrderCode(
        int $orderCode,
        string $gatewayTransactionId,
        ?array $rawData,
    ): WalletTopupOrder {
        return DB::transaction(function () use ($orderCode, $gatewayTransactionId, $rawData) {
            $order = WalletTopupOrder::query()
                ->where('order_code', $orderCode)
                ->lockForUpdate()
                ->first();

            if (! $order) {
                throw new OrderNotFoundAfterValidation($orderCode);
            }

            // Idempotent: already confirmed.
            if ($order->status === OrderStatus::Paid) {
                return $order;
            }

            if ($order->status !== OrderStatus::Pending) {
                throw new \RuntimeException(
                    "Order {$orderCode} is {$order->status->value}, expected pending."
                );
            }

            $profile = $order->profile;

            $this->walletService->creditToAccount(
                account: $order->account,
                profile: $profile,
                amount: $order->coins_to_credit,
                type: CoinTransactionType::Topup,
                source: $order,
                metadata: [
                    'provider' => $order->payment_provider,
                    'gateway_txn_id' => $gatewayTransactionId,
                ],
            );

            $order->update([
                'status' => OrderStatus::Paid,
                'paid_at' => now(),
                'gateway_transaction_id' => $gatewayTransactionId,
                'gateway_response' => $rawData,
                'callback_received_at' => now(),
            ]);

            DB::afterCommit(function () use ($order, $profile): void {
                if ($profile === null) {
                    return;
                }

                $notification = $this->notificationService->push(
                    profile: $profile,
                    type: NotificationType::TopupCompleted,
                    title: 'Nạp xu thành công',
                    body: "Bạn đã nhận {$order->coins_to_credit} xu.",
                    iconKey: IconKey::Coin,
                    dedupKey: "topup:{$order->id}",
                );

                if ($notification !== null) {
                    try {
                        SendPaymentInvoiceEmail::dispatch(SendPaymentInvoiceEmail::TYPE_TOPUP, $order->id);
                    } catch (\Throwable $e) {
                        Log::error('Failed to dispatch topup invoice email', [
                            'order_id' => $order->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            });

            return $order;
        });
    }

    public function cancelFromPaymentReturn(Profile $profile, string $paymentLinkId): WalletTopupOrder
    {
        $gateway = $this->gateways->get(PaymentProvider::PayOs);
        if (! $gateway instanceof PayOsGateway) {
            throw new \RuntimeException('PayOS gateway is not configured.');
        }

        $status = $gateway->getPaymentLinkStatus($paymentLinkId);

        return DB::transaction(function () use ($profile, $paymentLinkId, $status): WalletTopupOrder {
            $order = WalletTopupOrder::query()
                ->where(function ($query) use ($paymentLinkId, $status): void {
                    $query->where('gateway_transaction_id', $paymentLinkId)
                        ->orWhere('provider_ref', $paymentLinkId);

                    if ($status['orderCode'] > 0) {
                        $query->orWhere('order_code', $status['orderCode']);
                    }
                })
                ->lockForUpdate()
                ->first();

            if (! $order) {
                throw ValidationException::withMessages(['order' => ['Không tìm thấy đơn thanh toán.']]);
            }

            if ($order->profile_id !== $profile->id) {
                throw ValidationException::withMessages(['order' => ['Đơn hàng không thuộc hồ sơ hiện tại.']]);
            }

            if (strtoupper($status['status']) === 'CANCELLED' && $order->status === OrderStatus::Pending) {
                $order->update([
                    'status' => OrderStatus::Cancelled,
                    'gateway_response' => $status['raw'],
                    'callback_received_at' => now(),
                ]);
            }

            return $order->refresh();
        });
    }

    private function markFailed(int $orderCode, ?array $rawData): void
    {
        $order = WalletTopupOrder::query()
            ->where('order_code', $orderCode)
            ->where('status', OrderStatus::Pending)
            ->first();

        if ($order) {
            $order->update([
                'status' => OrderStatus::Failed,
                'gateway_response' => $rawData,
                'callback_received_at' => now(),
            ]);
        }
    }

    /** Generate unique order_code — time-based to avoid PayOS collision after rollback. */
    private function nextOrderCode(): int
    {
        return (int) (now()->getPreciseTimestamp(3));
    }
}
