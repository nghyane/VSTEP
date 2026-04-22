<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\GradingJob;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Raised when a grading job fails after exhausting retries.
 */
final class GradingFailed
{
    use Dispatchable;

    public function __construct(
        public readonly GradingJob $job,
        public readonly string $error,
    ) {}
}
