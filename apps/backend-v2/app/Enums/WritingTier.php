<?php

declare(strict_types=1);

namespace App\Enums;

enum WritingTier: int
{
    case TemplateFill = 1;
    case Guided = 2;
    case Freeform = 3;

    public static function fromScaffoldLevel(int $scaffoldLevel): self
    {
        return match (true) {
            $scaffoldLevel <= 0 => self::TemplateFill,
            $scaffoldLevel === 1 => self::Guided,
            default => self::Freeform,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::TemplateFill => 'Trợ nhiệt tình',
            self::Guided => 'Gợi ý khung',
            self::Freeform => 'Thực chiến',
        };
    }
}
