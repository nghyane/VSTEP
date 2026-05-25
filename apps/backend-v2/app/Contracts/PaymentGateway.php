<?php

declare(strict_types=1);

namespace App\Contracts;

use App\Enums\PaymentProvider;
use App\Models\WalletTopupOrder;
use App\ValueObjects\CallbackValidationResult;
use App\ValueObjects\PaymentGatewayResponse;

interface PaymentGateway
{
    /** Generate payment URL from gateway API. */
    public function createPayment(
        WalletTopupOrder $order,
        string $returnUrl,
        string $cancelUrl,
    ): PaymentGatewayResponse;

    /** Validate webhook callback data. */
    public function validateCallback(array $data): CallbackValidationResult;

    public function provider(): PaymentProvider;
}
