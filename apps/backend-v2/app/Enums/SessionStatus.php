<?php

namespace App\Enums;

enum SessionStatus: string
{
    case InProgress = 'in_progress';
    case Submitted = 'submitted';
    case Completed = 'completed';
    case Abandoned = 'abandoned';
}
