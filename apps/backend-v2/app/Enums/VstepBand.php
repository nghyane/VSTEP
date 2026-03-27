<?php

declare(strict_types=1);

namespace App\Enums;

enum VstepBand: string
{
    case B1 = 'B1';
    case B2 = 'B2';
    case C1 = 'C1';

    public function minLevel(): Level
    {
        return match ($this) {
            self::B1 => Level::B1,
            self::B2 => Level::B2,
            self::C1 => Level::C1,
        };
    }

    public static function fromScore(float $overall): ?self
    {
        return match (true) {
            $overall >= 8.5 => self::C1,
            $overall >= 6.0 => self::B2,
            $overall >= 4.0 => self::B1,
            default => null,
        };
    }
}
