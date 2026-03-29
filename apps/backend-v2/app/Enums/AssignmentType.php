<?php

declare(strict_types=1);

namespace App\Enums;

enum AssignmentType: string
{
    case Practice = 'practice';
    case Exam = 'exam';
}
