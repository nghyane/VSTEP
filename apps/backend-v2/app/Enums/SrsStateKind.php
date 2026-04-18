<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Anki SRS card state kinds.
 * - New: chưa học
 * - Learning: đang học, đi qua các steps
 * - Review: đã graduate, interval ngày
 * - Relearning: review failed, quay lại learning steps nhưng giữ review info
 */
enum SrsStateKind: string
{
    case New = 'new';
    case Learning = 'learning';
    case Review = 'review';
    case Relearning = 'relearning';
}
