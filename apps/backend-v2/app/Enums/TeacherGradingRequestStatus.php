<?php

declare(strict_types=1);

namespace App\Enums;

enum TeacherGradingRequestStatus: string
{
    case PendingAssignment = 'pending_assignment';
    case Assigned = 'assigned';
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case Rejected = 'rejected';

    /** @return list<string> */
    public static function activeValues(): array
    {
        return [
            self::PendingAssignment->value,
            self::Assigned->value,
            self::InProgress->value,
        ];
    }
}
