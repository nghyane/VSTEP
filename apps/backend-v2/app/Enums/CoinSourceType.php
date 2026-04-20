<?php

declare(strict_types=1);

namespace App\Enums;

use App\Models\CourseEnrollment;
use App\Models\PracticeSession;
use App\Models\Profile;
use App\Models\PromoCode;
use App\Models\PromoCodeRedemption;
use App\Models\WalletTopupOrder;

enum CoinSourceType: string
{
    case TopupOrder = 'wallet_topup_order';
    case PromoRedemption = 'promo_code_redemption';
    case PromoCode = 'promo_code';
    case CourseEnrollment = 'course_enrollment';
    case PracticeSession = 'practice_session';
    case Profile = 'profile';

    /** Map Eloquent model → source type. */
    private const MODEL_MAP = [
        WalletTopupOrder::class => self::TopupOrder,
        PromoCodeRedemption::class => self::PromoRedemption,
        PromoCode::class => self::PromoCode,
        CourseEnrollment::class => self::CourseEnrollment,
        PracticeSession::class => self::PracticeSession,
        Profile::class => self::Profile,
    ];

    public static function fromModel(string $class): self
    {
        return self::MODEL_MAP[$class]
            ?? throw new \InvalidArgumentException("Unmapped coin source: {$class}");
    }
}
