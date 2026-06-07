<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Coin transaction types. Append-only ledger — mỗi entry không được sửa.
 *
 * Positive types (delta > 0):
 * - Topup, OnboardingBonus, PromoRedeem, AdminGrant
 *
 * Negative types (delta < 0):
 * - ExamCustom, ExamFull, CoursePurchase, TeacherBooking, PracticeFeedback, TeacherGrading
 */
enum CoinTransactionType: string
{
    case Topup = 'topup';
    case OnboardingBonus = 'onboarding_bonus';
    case CourseBonus = 'course_bonus';
    case PromoRedeem = 'promo_redeem';
    case AdminGrant = 'admin_grant';
    case StreakMilestone = 'streak_milestone';
    case Refund = 'refund';
    case ExamCustom = 'exam_custom';
    case ExamFull = 'exam_full';
    case CoursePurchase = 'course_purchase';
    case TeacherBooking = 'teacher_booking';
    case PracticeFeedback = 'practice_feedback';
    case TeacherGrading = 'teacher_grading';

    public function isCredit(): bool
    {
        return match ($this) {
            self::Topup, self::OnboardingBonus, self::CourseBonus, self::PromoRedeem, self::AdminGrant, self::StreakMilestone, self::Refund => true,
            default => false,
        };
    }
}
