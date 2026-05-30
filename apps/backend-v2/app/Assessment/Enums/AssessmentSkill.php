<?php

declare(strict_types=1);

namespace App\Assessment\Enums;

enum AssessmentSkill: string
{
    case Writing = 'writing';
    case Speaking = 'speaking';
}
