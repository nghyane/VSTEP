<?php

declare(strict_types=1);

namespace App\Enums;

enum Role: string
{
    case Learner = 'learner';
    case Teacher = 'teacher';
    case Staff = 'staff';
    case Admin = 'admin';

    public function level(): int
    {
        return match ($this) {
            self::Learner => 0,
            self::Teacher => 1,
            self::Staff => 2,
            self::Admin => 3,
        };
    }

    public function is(Role $required): bool
    {
        return $this->level() >= $required->level();
    }
}
