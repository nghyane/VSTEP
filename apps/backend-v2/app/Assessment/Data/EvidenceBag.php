<?php

declare(strict_types=1);

namespace App\Assessment\Data;

final readonly class EvidenceBag
{
    /** @param array<string,mixed> $task, $content, $format, $reasoning, $development, $relevance, $raw */
    public function __construct(
        public array $task = [],
        public array $content = [],
        public array $format = [],
        public array $reasoning = [],
        public array $development = [],
        public array $relevance = [],
        public array $raw = [],
    ) {}
}
