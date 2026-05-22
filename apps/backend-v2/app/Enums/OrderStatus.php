<?php

declare(strict_types=1);

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Cancelled = 'cancelled';
    case Expired = 'expired';
    case Failed = 'failed';

    /**
     * Statuses that block creating a new order for the same entity.
     *
     * @return list<self>
     */
    public static function activeStatuses(): array
    {
        return [self::Pending, self::Paid];
    }

    /**
     * @return list<string>
     */
    public static function activeValues(): array
    {
        return array_map(fn (self $s) => $s->value, self::activeStatuses());
    }

    public function isPaid(): bool
    {
        return $this === self::Paid;
    }
}
