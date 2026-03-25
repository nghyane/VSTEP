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

    /**
     * VSTEP official rounding: <0.25 → floor, ≥0.25 → 0.5, ≥0.75 → ceil.
     */
    public static function roundScore(float $score): float
    {
        $integer = (int) $score;
        $decimal = $score - $integer;

        return match (true) {
            $decimal >= 0.75 => $integer + 1.0,
            $decimal >= 0.25 => $integer + 0.5,
            default => (float) $integer,
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
