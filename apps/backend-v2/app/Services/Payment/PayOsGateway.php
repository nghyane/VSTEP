<?php

declare(strict_types=1);

namespace App\Services\Payment;

use App\Contracts\PaymentGateway;
use App\Enums\PaymentProvider;
use App\Models\WalletTopupOrder;
use App\ValueObjects\CallbackValidationResult;
use App\ValueObjects\PaymentGatewayResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * PayOS payment gateway integration.
 *
 * API docs: https://payos.vn/docs/api/
 * Signature: https://payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature/
 */
final class PayOsGateway implements PaymentGateway
{
    private string $apiUrl;

    private string $clientId;

    private string $apiKey;

    private string $checksumKey;

    public function __construct()
    {
        $this->apiUrl = (string) config('payment.payos.api_url');
        $this->clientId = (string) config('payment.payos.client_id');
        $this->apiKey = (string) config('payment.payos.api_key');
        $this->checksumKey = (string) config('payment.payos.checksum_key');
    }

    public function provider(): PaymentProvider
    {
        return PaymentProvider::PayOs;
    }

    public function createPayment(
        WalletTopupOrder $order,
        string $returnUrl,
        string $cancelUrl,
    ): PaymentGatewayResponse {
        $expiredAt = $order->expires_at?->timestamp ?? now()->addMinutes(15)->timestamp;

        $payload = [
            'orderCode' => $order->order_code,
            'amount' => $order->amount_vnd,
            'description' => $this->makeDescription($order),
            'cancelUrl' => $cancelUrl,
            'returnUrl' => $returnUrl,
            'expiredAt' => $expiredAt,
        ];

        $payload['signature'] = $this->signPaymentRequest($payload);

        $response = Http::withHeaders([
            'x-client-id' => $this->clientId,
            'x-api-key' => $this->apiKey,
            'Content-Type' => 'application/json',
        ])->post($this->apiUrl.'/v2/payment-requests', $payload);

        if ($response->failed()) {
            Log::error('PayOS create payment failed', [
                'order_code' => $order->order_code,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('PayOS create payment failed: '.$response->body());
        }

        $data = $response->json('data');

        return new PaymentGatewayResponse(
            paymentUrl: $data['checkoutUrl'],
            gatewayTransactionId: $data['paymentLinkId'],
            rawResponse: $data,
        );
    }

    public function validateCallback(array $data): CallbackValidationResult
    {
        $signature = $data['signature'] ?? '';
        $paymentData = $data['data'] ?? [];
        $success = ($data['code'] ?? '') === '00' && ($data['success'] ?? false);

        // Verify signature — ksort data object, json_encode, HMAC-SHA256
        if (! $this->verifySignature($paymentData, $signature)) {
            Log::warning('PayOS webhook: invalid signature', ['orderCode' => $paymentData['orderCode'] ?? null]);

            return new CallbackValidationResult(
                success: false,
                orderCode: (int) ($paymentData['orderCode'] ?? 0),
                gatewayTransactionId: (string) ($paymentData['paymentLinkId'] ?? ''),
                amount: (int) ($paymentData['amount'] ?? 0),
                rawData: $data,
                failureReason: 'Invalid signature',
            );
        }

        return new CallbackValidationResult(
            success: $success,
            orderCode: (int) $paymentData['orderCode'],
            gatewayTransactionId: $paymentData['paymentLinkId'] ?? $paymentData['reference'] ?? '',
            amount: (int) ($paymentData['amount'] ?? 0),
            rawData: $data,
            failureReason: $success ? null : ($data['desc'] ?? 'Payment failed'),
        );
    }

    /**
     * Sign for creating payment link.
     * data = "amount={amount}&cancelUrl={cancelUrl}&description={description}&orderCode={orderCode}&returnUrl={returnUrl}"
     * Alphabetically sorted keys.
     */
    private function signPaymentRequest(array $payload): string
    {
        $data = "amount={$payload['amount']}"
            ."&cancelUrl={$payload['cancelUrl']}"
            ."&description={$payload['description']}"
            ."&orderCode={$payload['orderCode']}"
            ."&returnUrl={$payload['returnUrl']}";

        return hash_hmac('sha256', $data, $this->checksumKey);
    }

    /**
     * Verify webhook signature — exact algorithm from PayOS docs PHP sample.
     *
     * @see https://payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature/
     */
    private function verifySignature(array $data, string $providedSignature): bool
    {
        $sorted = $data;
        ksort($sorted);

        $strArr = [];
        foreach ($sorted as $key => $value) {
            if ($value === null || $value === 'null' || $value === 'undefined') {
                $value = '';
            }
            if (is_array($value)) {
                $valueSorted = array_map(function ($ele) {
                    if (is_array($ele)) {
                        ksort($ele);
                    }

                    return $ele;
                }, $value);
                $value = json_encode($valueSorted, JSON_UNESCAPED_UNICODE);
            }
            $strArr[] = $key.'='.$value;
        }

        $signatureStr = implode('&', $strArr);
        $computed = hash_hmac('sha256', $signatureStr, $this->checksumKey);

        return hash_equals($computed, $providedSignature);
    }

    /**
     * PayOS description limited to ~9 chars for non-linked bank accounts.
     */
    private function makeDescription(WalletTopupOrder $order): string
    {
        return 'VSTEP'.$order->order_code;
    }
}
