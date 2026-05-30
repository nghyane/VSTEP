<?php

declare(strict_types=1);

namespace App\Assessment\Data;

final readonly class FeedbackBag
{
    /** @param list<string> $strengths, $improvements, $warnings, $evidenceNotes, $rewrites */
    public function __construct(
        public array $strengths = [],
        public array $improvements = [],
        public array $warnings = [],
        public array $evidenceNotes = [],
        public array $rewrites = [],
    ) {}
}
