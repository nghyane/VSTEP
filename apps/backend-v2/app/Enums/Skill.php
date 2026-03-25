<?php

declare(strict_types=1);

namespace App\Enums;

enum Skill: string
{
    case Listening = 'listening';
    case Reading = 'reading';
    case Writing = 'writing';
    case Speaking = 'speaking';

    public function isObjective(): bool
    {
        return match ($this) {
            self::Listening, self::Reading => true,
            default => false,
        };
    }

    public function scoreColumn(): string
    {
        return match ($this) {
            self::Listening => 'listening_score',
            self::Reading => 'reading_score',
            self::Writing => 'writing_score',
            self::Speaking => 'speaking_score',
        };
    }
}
