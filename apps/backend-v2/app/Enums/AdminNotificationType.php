<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Loại thông báo cho admin/teacher panel.
 */
enum AdminNotificationType: string
{
    case BookingCreated = 'booking_created';
    case BookingCancelled = 'booking_cancelled';
}
