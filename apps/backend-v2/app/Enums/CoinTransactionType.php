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
 * - SupportLevelUse, ExamCustom, ExamFull, CoursePurchase
 */
enum CoinTransactionType: string
{
    case Topup = 'topup';
    case OnboardingBonus = 'onboarding_bonus';
    case PromoRedeem = 'promo_redeem';
    case AdminGrant = 'admin_grant';
    case SupportLevelUse = 'support_level_use';
    case ExamCustom = 'exam_custom';
    case ExamFull = 'exam_full';
    case CoursePurchase = 'course_purchase';

    public function isCredit(): bool
    {
        return match ($this) {
            self::Topup, self::OnboardingBonus, self::PromoRedeem, self::AdminGrant => true,
            default => false,
        };
    }
}
