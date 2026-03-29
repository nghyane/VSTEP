<?php

declare(strict_types=1);

namespace App\Enums;

enum AssignmentSubmissionStatus: string
{
    case Pending = 'pending';
    case Submitted = 'submitted';
    case Graded = 'graded';
}
