<?php

declare(strict_types=1);

namespace App\Services\Payment;

/**
 * Thrown when a callback has a valid signature but the order doesn't exist in the database.
 * Used for PayOS confirm-webhook test where a sample webhook is sent before any real orders.
 */
final class OrderNotFoundAfterValidation extends \RuntimeException
{
    public function __construct(
        public readonly int $orderCode,
    ) {
        parent::__construct("Order not found: order_code={$orderCode}");
    }
}
