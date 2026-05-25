<?php

declare(strict_types=1);

namespace App\Services\Payment;

use App\Contracts\PaymentGateway;
use App\Enums\PaymentProvider;

final class PaymentGatewayRegistry
{
    /** @param array<string, PaymentGateway> $gateways */
    public function __construct(
        private readonly array $gateways,
    ) {}

    public function get(PaymentProvider $provider): PaymentGateway
    {
        return $this->gateways[$provider->value]
            ?? throw new \InvalidArgumentException("Unknown payment provider: {$provider->value}");
    }
}
