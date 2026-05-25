<?php

declare(strict_types=1);

namespace App\ValueObjects;

final readonly class PaymentGatewayResponse
{
    public function __construct(
        public string $paymentUrl,
        public ?string $gatewayTransactionId = null,
        public ?array $rawResponse = null,
    ) {}
}
