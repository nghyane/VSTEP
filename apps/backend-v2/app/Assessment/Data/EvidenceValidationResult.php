<?php

declare(strict_types=1);

namespace App\Assessment\Data;

final readonly class EvidenceValidationResult
{
    /** @param list<string> $errors, $warnings */
    public function __construct(
        public bool $passed,
        public array $errors = [],
        public array $warnings = [],
    ) {}
}
