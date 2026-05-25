<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentProvider: string
{
    case PayOs = 'payos';
    case VnPay = 'vnpay';

    /** @return list<self> */
    public static function available(): array
    {
        return [self::PayOs, self::VnPay];
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $p) => $p->value, self::available());
    }
}
