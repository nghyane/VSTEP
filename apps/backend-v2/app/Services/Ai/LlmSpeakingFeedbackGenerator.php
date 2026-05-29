<?php

declare(strict_types=1);

namespace App\Services\Ai;

use App\Ai\AiClient;
use App\Ai\Contracts\SpeakingFeedbackGenerator;

final class LlmSpeakingFeedbackGenerator implements SpeakingFeedbackGenerator
{
    public function __construct(
        private readonly AiClient $ai,
    ) {}

    public function generate(
        string $transcript,
        string $promptText,
        array $scores,
        array $metrics,
        ?array $bandContext = null,
    ): array {
        $prompt = view('ai.grading.speaking-feedback', [
            'transcript' => $transcript,
            'promptText' => $promptText,
            'scores' => $scores,
            'metrics' => $metrics,
            'bandContext' => $bandContext,
        ])->render();

        $structured = $this->ai->toolCall(
            service: 'grading',
            prompt: $prompt,
            toolName: 'generate_speaking_feedback',
            toolDescription: 'Generate personalized feedback for the student speaking response.',
            parametersSchema: [
                'strengths' => ['type' => 'array', 'items' => ['type' => 'string']],
                'improvements' => ['type' => 'array', 'items' => ['type' => 'string']],
            ],
            instructions: 'You are a VSTEP speaking coach. Strengths and improvements in Vietnamese. '
                .'Keep each item 1-2 sentences, specific and actionable.',
        );

        return [
            'strengths' => array_values(array_filter(
                (array) ($structured['strengths'] ?? []),
                fn ($item) => is_string($item) && $item !== '',
            )),
            'improvements' => array_values(array_filter(
                (array) ($structured['improvements'] ?? []),
                fn ($item) => is_string($item) && $item !== '',
            )),
        ];
    }
}
