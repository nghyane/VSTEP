<?php

namespace App\Enums;

enum Role: string
{
    case Learner = 'learner';
    case Instructor = 'instructor';
    case Admin = 'admin';

    public function level(): int
    {
        return match ($this) {
            self::Learner => 0,
            self::Instructor => 1,
            self::Admin => 2,
        };
    }

    public function is(Role $required): bool
    {
        return $this->level() >= $required->level();
    }
}
