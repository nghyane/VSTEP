<?php

declare(strict_types=1);

namespace App\Ai\Contracts;

interface SpeakingFeedbackGenerator
{
    /**
     * Generate personalized Vietnamese feedback for speaking.
     *
     * @param  array<string,mixed>  $scores  rubric scores from SpeakingScoringFormula
     * @param  array{current: string, target: string}|null  $bandContext
     * @return array{strengths: list<string>, improvements: list<string>}
     */
    public function generate(
        string $transcript,
        string $promptText,
        array $scores,
        array $metrics,
        ?array $bandContext = null,
    ): array;
}
