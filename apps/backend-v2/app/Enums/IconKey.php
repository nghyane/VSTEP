<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Icon key cho notification + UI hints. Frontend resolve qua icon registry.
 */
enum IconKey: string
{
    case Alert = 'alert';
    case Award = 'award';
    case Book = 'book';
    case Calendar = 'calendar';
    case Check = 'check';
    case Coin = 'coin';
    case Gift = 'gift';
    case Mic = 'mic';
    case Trash = 'trash';
}
