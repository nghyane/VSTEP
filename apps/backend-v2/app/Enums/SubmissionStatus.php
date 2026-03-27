<?php

declare(strict_types=1);

namespace App\Enums;

enum SubmissionStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Completed = 'completed';
    case ReviewPending = 'review_pending';
    case Failed = 'failed';
}
