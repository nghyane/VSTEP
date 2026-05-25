<?php

declare(strict_types=1);

namespace App\ValueObjects;

final readonly class CallbackValidationResult
{
    public function __construct(
        public bool $success,
        public int $orderCode,
        public string $gatewayTransactionId,
        public int $amount,
        public ?array $rawData = null,
        public ?string $failureReason = null,
    ) {}
}
