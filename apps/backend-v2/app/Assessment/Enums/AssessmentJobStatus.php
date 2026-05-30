<?php

declare(strict_types=1);

namespace App\Assessment\Enums;

enum AssessmentJobStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Ready = 'ready';
    case Failed = 'failed';
}
