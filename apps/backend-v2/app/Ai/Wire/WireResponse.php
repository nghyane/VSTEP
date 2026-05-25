<?php

declare(strict_types=1);

namespace App\Ai\Wire;

/**
 * Immutable value object representing an LLM response.
 */
final readonly class WireResponse
{
    /**
     * @param  array<string,mixed>|null  $structured  Parsed JSON if structured output was requested
     * @param  array{input_tokens: int, output_tokens: int}  $usage
     */
    public function __construct(
        public string $text,
        public ?array $structured = null,
        public array $usage = ['input_tokens' => 0, 'output_tokens' => 0],
        public string $model = '',
    ) {}
}
