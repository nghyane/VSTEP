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
    case TeacherGradingRequestCreated = 'teacher_grading_request_created';
    case TeacherGradingRequestAssigned = 'teacher_grading_request_assigned';
    case TeacherGradingRequestCompleted = 'teacher_grading_request_completed';
}
