<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\Ai\AiClient;

/**
 * Shared LLM evidence extraction client.
 *
 * LLM observes text and returns countable facts — never scores.
 * Formula computes scores deterministically from evidence.
 */
final class LlmGradingService implements LlmGrader
{
    public function __construct(
        private readonly AiClient $ai,
    ) {}

    /**
     * Extract structured evidence from text (not scores).
     *
     * Called by both WritingGradingStrategy (task fulfillment)
     * and SpeakingGradingStrategy (content relevance for exam).
     *
     * @param  list<string>                              $requirements   Task requirements to check
     * @param  list<array<string,mixed>>                 $grammarErrors  LanguageTool matches
     * @param  array{metrics: array<string,mixed>, syntax: array, flags: list<string>}  $ruleAnalysis
     * @return array{evidence: array, strengths: list<string>, improvements: list<array>, rewrites: list<array>}
     */
    public function extractEvidence(string $text, string $promptText, array $requirements, array $grammarErrors, array $ruleAnalysis): array
    {
        $grammarErrors = array_slice($grammarErrors, 0, 10);

        $linkingWords = $this->detectedLinkingWords($text);

        $prompt = view('ai.grading.writing-evidence', [
            'promptText' => $promptText,
            'text' => $text,
            'wordCount' => str_word_count($text),
            'grammarErrors' => $grammarErrors,
            'metrics' => $ruleAnalysis['metrics'] ?? [],
            'syntax' => $ruleAnalysis['syntax'] ?? null,
            'linkingWords' => $linkingWords,
            'requirements' => $requirements,
        ])->render();

        return $this->callEvidence($prompt);
    }

    /**
     * @return list<string>
     */
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

    /**
     * Call LLM for evidence extraction (structured output, not scores).
     *
     * @return array{evidence: array, strengths: list<string>, improvements: list<array>, rewrites: list<array>}
     */
    private function callEvidence(string $prompt): array
    {
        $schema = $this->evidenceSchema();
        $instructions = "You are a VSTEP writing evidence collector. Extract OBSERVABLE facts from the text. "
            ."DO NOT assign scores. Count what is present. Be objective.\n\n"
            ."Output language: Vietnamese for strengths/improvements/rewrites.";

        $structured = $this->ai->toolCall(
            service: 'grading',
            prompt: $prompt,
            toolName: 'extract_writing_evidence',
            toolDescription: 'Submit observable facts from the student writing. Count what is actually present in the text. Do not score.',
            parametersSchema: $schema,
            instructions: $instructions,
        );

        return [
            'evidence' => [
                'task_fulfillment' => [
                    'points_covered' => (int) ($structured['requirements_met'] ?? 0),
                    'points_required' => (int) ($structured['requirements_total'] ?? 1),
                    'has_clear_position' => (bool) ($structured['has_clear_position'] ?? false),
                    'has_irrelevant_content' => (bool) ($structured['has_irrelevant_content'] ?? false),
                ],
            ],
            'strengths' => array_values(array_filter(
                (array) ($structured['strengths'] ?? []),
                fn ($item) => is_string($item) && $item !== '',
            )),
            'improvements' => $this->normalizeImprovements($structured['improvements'] ?? []),
            'rewrites' => array_values(array_filter(
                (array) ($structured['rewrites'] ?? []),
                fn ($item) => is_string($item) && $item !== '',
            )),
        ];
    }

    /** @return array<string,mixed> */
    private function evidenceSchema(): array
    {
        return [
            'requirements_met' => ['type' => 'integer'],
            'requirements_total' => ['type' => 'integer'],
            'has_clear_position' => ['type' => 'boolean'],
            'has_irrelevant_content' => ['type' => 'boolean'],
            'strengths' => ['type' => 'array', 'items' => ['type' => 'string']],
            'improvements' => ['type' => 'array', 'items' => ['type' => 'string']],
            'rewrites' => ['type' => 'array', 'items' => ['type' => 'string']],
        ];
    }

    /**
     * @return list<array{message:string,explanation:string}>
     */
    private function normalizeImprovements(mixed $improvements): array
    {
        $items = is_array($improvements) ? $improvements : [];

        return array_values(array_map(function (mixed $item): array {
            if (is_string($item)) {
                return ['message' => $item, 'explanation' => $item];
            }

            if (is_array($item)) {
                return [
                    'message' => (string) ($item['message'] ?? $item['explanation'] ?? ''),
                    'explanation' => (string) ($item['explanation'] ?? $item['message'] ?? ''),
                ];
            }

            return ['message' => '', 'explanation' => ''];
        }, $items));
    }
}
