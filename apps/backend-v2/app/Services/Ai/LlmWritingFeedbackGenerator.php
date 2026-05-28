<?php

declare(strict_types=1);

namespace App\Services\Ai;

use App\Ai\AiClient;
use App\Ai\Contracts\WritingFeedbackGenerator;

final class LlmWritingFeedbackGenerator implements WritingFeedbackGenerator
{
    public function __construct(
        private readonly AiClient $ai,
    ) {}

    public function generate(string $text, string $promptText, array $metrics, array $grammarErrors, ?array $bandContext = null): array
    {
        $grammarErrors = array_slice($grammarErrors, 0, 10);

        $prompt = view('ai.grading.writing-feedback', [
            'promptText' => $promptText,
            'text' => $text,
            'wordCount' => str_word_count($text),
            'grammarErrors' => $grammarErrors,
            'metrics' => $metrics,
            'bandContext' => $bandContext,
        ])->render();

        $structured = $this->ai->toolCall(
            service: 'grading',
            prompt: $prompt,
            toolName: 'generate_writing_feedback',
            toolDescription: 'Generate personalized feedback for the student writing.',
            parametersSchema: [
                'strengths' => ['type' => 'array', 'items' => ['type' => 'string']],
                'improvements' => ['type' => 'array', 'items' => ['type' => 'string']],
                'rewrites' => ['type' => 'array', 'items' => ['type' => 'string']],
            ],
            instructions: 'You are a VSTEP writing coach. Strengths and improvements in Vietnamese. '
                ."Rewrites: show improved English version (do NOT translate), format as 'Original: ... → Improved: ...'.",
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
            'rewrites' => array_values(array_filter(
                (array) ($structured['rewrites'] ?? []),
                fn ($item) => is_string($item) && $item !== '',
            )),
        ];
    }
}
