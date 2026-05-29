<?php

declare(strict_types=1);

namespace App\Ai\Contracts;

interface WritingFeedbackGenerator
{
    /**
     * Generate personalized Vietnamese feedback for writing.
     *
     * @param  array<string,mixed>  $metrics
     * @param  list<array<string,mixed>>  $grammarErrors
     * @param  array{current: string, target: string}|null  $bandContext
     * @return array{strengths: list<string>, improvements: list<string>, rewrites: list<string>}
     */
    public function generate(string $text, string $promptText, array $metrics, array $grammarErrors, ?array $bandContext = null, int $part = 2): array;
}
