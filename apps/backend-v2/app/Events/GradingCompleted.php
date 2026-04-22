<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\GradingJob;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Raised when a grading job completes successfully (status=ready).
 */
final class GradingCompleted
{
    use Dispatchable;

    public function __construct(
        public readonly GradingJob $job,
    ) {}
}
