<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\Ai\AiClient;

/**
 * Shared LLM grading client.
 *
 * Two-phase design for faster UX:
 *   1. extractEvidence — fast (2-3s), returns countable facts only
 *   2. generateFeedback — slower (3-5s), Vietnamese prose output
 *
 * Scoring shown after phase 1, feedback appended after phase 2.
 */
final class LlmGradingService implements LlmGrader
{
    public function __construct(
        private readonly AiClient $ai,
    ) {}

    /**
     * Phase 1: Extract task fulfillment evidence (fast — no prose).
     *
     * @param  list<string>                              $requirements
     * @param  list<array<string,mixed>>                 $grammarErrors
     * @param  array{metrics: array<string,mixed>, syntax: array, flags: list<string>}  $ruleAnalysis
     * @return array{evidence: array}
     */
    public function extractEvidence(string $text, string $promptText, array $requirements, array $grammarErrors, array $ruleAnalysis): array
    {
        $prompt = view('ai.grading.writing-evidence', [
            'promptText' => $promptText,
            'text' => $text,
            'wordCount' => str_word_count($text),
            'grammarErrors' => array_slice($grammarErrors, 0, 10),
            'metrics' => $ruleAnalysis['metrics'] ?? [],
            'syntax' => $ruleAnalysis['syntax'] ?? null,
            'linkingWords' => $this->detectedLinkingWords($text),
            'requirements' => $requirements,
            'bandContext' => null,
        ])->render();

        $schema = [
            'requirements_met' => ['type' => 'number'],
            'requirements_total' => ['type' => 'number'],
            'has_clear_position' => ['type' => 'boolean'],
            'has_irrelevant_content' => ['type' => 'boolean'],
        ];

        $structured = $this->ai->toolCall(
            service: 'grading',
            prompt: $prompt,
            toolName: 'extract_writing_evidence',
            toolDescription: 'Count observable facts from the student writing. Do not score.',
            parametersSchema: $schema,
            instructions: 'You are a VSTEP writing evidence collector. Count what is present. Be objective. DO NOT write feedback.',
        );

        return [
            'evidence' => [
                'task_fulfillment' => [
                    'points_covered' => max(0.0, (float) ($structured['requirements_met'] ?? 0)),
                    'points_required' => max(1.0, (float) ($structured['requirements_total'] ?? 1)),
                    'has_clear_position' => (bool) ($structured['has_clear_position'] ?? false),
                    'has_irrelevant_content' => (bool) ($structured['has_irrelevant_content'] ?? false),
                ],
            ],
        ];
    }

    /**
     * Phase 2: Generate feedback (Vietnamese prose — slower).
     *
     * @param  array<string,mixed>                        $metrics
     * @param  list<array<string,mixed>>                  $grammarErrors
     * @param  array{current: string, target: string}|null  $bandContext
     * @return array{strengths: list<string>, improvements: list<string>, rewrites: list<string>}
     */
    public function generateFeedback(string $text, string $promptText, array $metrics, array $grammarErrors, ?array $bandContext = null): array
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

        $schema = [
            'strengths' => ['type' => 'array', 'items' => ['type' => 'string']],
            'improvements' => ['type' => 'array', 'items' => ['type' => 'string']],
            'rewrites' => ['type' => 'array', 'items' => ['type' => 'string']],
        ];

        $structured = $this->ai->toolCall(
            service: 'grading',
            prompt: $prompt,
            toolName: 'generate_writing_feedback',
            toolDescription: 'Generate personalized feedback for the student writing.',
            parametersSchema: $schema,
            instructions: "You are a VSTEP writing coach. Write feedback in Vietnamese. "
                ."Strengths: what they did well. Improvements: what to fix (one per line). Rewrites: corrected versions of problem sentences.",
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

    /** @return list<string> */
    private function detectedLinkingWords(string $text): array
    {
        $linkingWords = [
            'however', 'moreover', 'furthermore', 'therefore', 'consequently',
            'nevertheless', 'although', 'despite', 'in addition', 'on the other hand',
            'firstly', 'secondly', 'finally', 'in conclusion', 'for example',
            'as a result', 'in contrast', 'meanwhile', 'similarly',
        ];
        $found = [];
        $textLower = strtolower($text);
        foreach ($linkingWords as $lw) {
            if (str_contains($textLower, $lw)) {
                $found[] = $lw;
            }
        }

        return $found;
    }
}
