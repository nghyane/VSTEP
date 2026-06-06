<?php

declare(strict_types=1);

namespace App\Services\Contracts;

use App\Models\ExamSession;
use App\Models\Profile;

interface ExamSessionExpiryInterface
{
    public function forceSubmitExpired(?Profile $profile = null): int;

    public function forceSubmitIfExpired(ExamSession $session): bool;
}
