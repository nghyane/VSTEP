<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Notification types BE phát ra. Phải đồng bộ với FE types
 * (apps/frontend-v3/src/features/notifications/types.ts).
 */
enum NotificationType: string
{
    case TopupCompleted = 'topup_completed';
    case CoinReceived = 'coin_received';
    case AssessmentCompleted = 'assessment_completed';
    case AssessmentFailed = 'assessment_failed';
    case CourseEnrolled = 'course_enrolled';
    case CourseUnenrolled = 'course_unenrolled';
    case BookingCreated = 'booking_created';
    case BookingCancelled = 'booking_cancelled';
    case BookingMeetUrlUpdated = 'booking_meet_url_updated';
    case StudyReminder = 'study_reminder';
}
