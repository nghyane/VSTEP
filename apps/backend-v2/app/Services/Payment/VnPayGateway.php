<?php

declare(strict_types=1);

namespace App\Services\Payment;

use App\Contracts\PaymentGateway;
use App\Enums\PaymentProvider;
use App\Models\WalletTopupOrder;
use App\ValueObjects\CallbackValidationResult;
use App\ValueObjects\PaymentGatewayResponse;

/**
 * VNPay gateway — stub for future integration.
 */
final class VnPayGateway implements PaymentGateway
{
    public function provider(): PaymentProvider
    {
        return PaymentProvider::VnPay;
    }

    public function createPayment(
        WalletTopupOrder $order,
        string $returnUrl,
        string $cancelUrl,
    ): PaymentGatewayResponse {
        throw new \RuntimeException('VNPay gateway not yet implemented.');
    }

    public function validateCallback(array $data): CallbackValidationResult
    {
        throw new \RuntimeException('VNPay gateway not yet implemented.');
    }
}
