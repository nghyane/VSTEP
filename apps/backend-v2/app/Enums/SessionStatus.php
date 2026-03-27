<?php

declare(strict_types=1);

namespace App\Enums;

enum SessionStatus: string
{
    case InProgress = 'in_progress';
    case Submitted = 'submitted';
    case Completed = 'completed';
    case Abandoned = 'abandoned';
}
