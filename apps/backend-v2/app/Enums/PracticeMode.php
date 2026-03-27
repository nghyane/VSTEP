<?php

declare(strict_types=1);

namespace App\Enums;

enum PracticeMode: string
{
    case Free = 'free';
    case Shadowing = 'shadowing';
    case Drill = 'drill';
    case Guided = 'guided';

    public function availableForSkill(Skill $skill): bool
    {
        return match ($this) {
            self::Free => true,
            self::Shadowing, self::Drill => $skill === Skill::Speaking,
            self::Guided => $skill === Skill::Writing,
        };
    }

    public function defaultItemsCount(?Skill $skill = null): int
    {
        return match ($this) {
            self::Free => $skill?->isObjective() ? 2 : 5,
            self::Shadowing => 8,
            self::Drill => 10,
            self::Guided => 3,
        };
    }
}
