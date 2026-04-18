<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Profile;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Raised after a profile is created. Economy listener cấp onboarding_bonus
 * nếu profile là initial.
 */
final class ProfileCreated
{
    use Dispatchable;

    public function __construct(
        public readonly Profile $profile,
    ) {}
}
