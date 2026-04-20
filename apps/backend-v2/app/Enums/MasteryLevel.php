<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Grammar mastery level — derive từ attempts/correct count.
 *
 * Thresholds (khớp với FE src/lib/grammar/mastery.ts):
 * - new: 0 attempts
 * - mastered: >= 5 attempts AND accuracy >= 85%
 * - practicing: >= 3 attempts AND accuracy >= 60%
 * - learning: everything else
 */
enum MasteryLevel: string
{
    case New = 'new';
    case Learning = 'learning';
    case Practicing = 'practicing';
    case Mastered = 'mastered';

    public static function compute(int $attempts, int $correct): self
    {
        if ($attempts === 0) {
            return self::New;
        }
        $accuracy = $correct / $attempts;
        if ($attempts >= 5 && $accuracy >= 0.85) {
            return self::Mastered;
        }
        if ($attempts >= 3 && $accuracy >= 0.60) {
            return self::Practicing;
        }

        return self::Learning;
    }
}
