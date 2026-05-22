<?php

declare(strict_types=1);

namespace App\Enums;

enum BookingStatus: string
{
    case Booked = 'booked';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    /**
     * @return list<self>
     */
    public static function activeStatuses(): array
    {
        return [self::Booked, self::Completed];
    }

    /**
     * @return list<string>
     */
    public static function activeValues(): array
    {
        return array_map(fn (self $s) => $s->value, self::activeStatuses());
    }
}
