<?php

declare(strict_types=1);

namespace App\Assessment\Data;

final readonly class SignalBag
{
    /** @param array<string,mixed> $grammar, $vocabulary, $syntax, $coherence, $writingFormat, $speech, $pronunciation, $raw */
    public function __construct(
        public array $grammar = [],
        public array $vocabulary = [],
        public array $syntax = [],
        public array $coherence = [],
        public array $writingFormat = [],
        public array $speech = [],
        public array $pronunciation = [],
        public array $raw = [],
    ) {}
}
