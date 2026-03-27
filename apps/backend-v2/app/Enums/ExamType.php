<?php

declare(strict_types=1);

namespace App\Enums;

enum ExamType: string
{
    case Practice = 'practice';
    case Placement = 'placement';
    case Mock = 'mock';
}
