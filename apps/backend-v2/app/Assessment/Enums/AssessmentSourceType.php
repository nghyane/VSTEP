<?php

declare(strict_types=1);

namespace App\Assessment\Enums;

enum AssessmentSourceType: string
{
    case Practice = 'practice';
    case Exam = 'exam';
}
