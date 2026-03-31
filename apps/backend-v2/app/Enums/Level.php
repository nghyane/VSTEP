<?php

declare(strict_types=1);

namespace App\Enums;

enum Level: string
{
    case A2 = 'A2';
    case B1 = 'B1';
    case B2 = 'B2';
    case C1 = 'C1';

    public function next(): ?self
    {
        $cases = self::cases();
        $idx = array_search($this, $cases);

        return $idx !== false && $idx < count($cases) - 1 ? $cases[$idx + 1] : null;
    }

    public function prev(): ?self
    {
        $cases = self::cases();
        $idx = array_search($this, $cases);

        return $idx !== false && $idx > 0 ? $cases[$idx - 1] : null;
    }

    public function score(): int
    {
        return match ($this) {
            self::A2 => 1, self::B1 => 2, self::B2 => 3, self::C1 => 4,
        };
    }

    public function passThreshold(): float
    {
        return match ($this) {
            self::A2 => 6.0,
            self::B1 => 6.5,
            self::B2 => 7.0,
            self::C1 => 7.5,
        };
    }

    /**
     * Initial scaffold_level for a user placed at this level.
     * A2 = 0 (Tier 1: template), B1 = 1 (Tier 2: guided), B2/C1 = 2 (Tier 3: freeform).
     */
    public function initialScaffoldLevel(): int
    {
        return match ($this) {
            self::A2 => 0,
            self::B1 => 1,
            self::B2, self::C1 => 2,
        };
    }

    public static function fromScore(?float $score): self
    {
        return match (true) {
            $score >= 8.5 => self::C1,
            $score >= 6.0 => self::B2,
            $score >= 4.0 => self::B1,
            default => self::A2,
        };
    }
}
