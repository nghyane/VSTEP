<?php

declare(strict_types=1);

namespace App\Ai\Wire;

/**
 * Immutable value object representing a request to an LLM.
 */
final readonly class WireRequest
{
    /**
     * @param  array<string,mixed>|null  $schema  JSON Schema for structured output
     * @param  'none'|'low'|'medium'|'high'  $thinking  Reasoning effort level
     */
    public function __construct(
        public string $model,
        public string $prompt,
        public ?string $instructions = null,
        public ?array $schema = null,
        public ?float $temperature = null,
        public int $timeout = 60,
        public string $thinking = 'none',
    ) {}
}
