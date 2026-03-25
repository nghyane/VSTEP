<?php

declare(strict_types=1);

namespace App\Enums;

enum StreakDirection: string
{
    case Up = 'up';
    case Down = 'down';
    case Neutral = 'neutral';
}
