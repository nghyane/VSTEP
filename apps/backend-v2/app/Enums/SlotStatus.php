<?php

declare(strict_types=1);

namespace App\Enums;

enum SlotStatus: string
{
    case Open = 'open';
    case Booked = 'booked';
}
