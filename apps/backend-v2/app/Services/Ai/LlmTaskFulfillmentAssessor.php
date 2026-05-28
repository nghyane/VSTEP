<?php

declare(strict_types=1);

namespace App\Services\Ai;

use App\Ai\AiClient;
use App\Ai\Contracts\TaskFulfillmentAssessor;

final class LlmTaskFulfillmentAssessor implements TaskFulfillmentAssessor
{
    public function __construct(
        private readonly AiClient $ai,
    ) {}

    public function assess(string $text, string $promptText, array $requirements, array $grammarErrors, array $ruleAnalysis, int $part = 2): array
    {
        $grammarErrors = array_slice($grammarErrors, 0, 10);

        $prompt = view('ai.grading.writing-evidence', [
            'promptText' => $promptText,
            'text' => $text,
            'wordCount' => str_word_count($text),
            'grammarErrors' => $grammarErrors,
            'metrics' => $ruleAnalysis['metrics'] ?? [],
            'syntax' => $ruleAnalysis['syntax'] ?? null,
            'linkingWords' => $this->detectedLinkingWords($text),
            'requirements' => $requirements,
            'part' => $part,
        ])->render();

        $structured = $this->ai->toolCall(
            service: 'grading',
            prompt: $prompt,
            toolName: 'extract_writing_evidence',
            toolDescription: 'Count observable facts from the student writing. Do not score.',
            parametersSchema: [
                'requirements_met' => ['type' => 'number'],
                'requirements_total' => ['type' => 'number'],
                'has_clear_position' => ['type' => 'boolean'],
                'has_irrelevant_content' => ['type' => 'boolean'],
            ],
            instructions: 'You are a VSTEP writing evidence collector. Count what is present. Be objective. DO NOT write feedback.',
        );

        return [
            'points_covered' => max(0.0, (float) ($structured['requirements_met'] ?? 0)),
            'points_required' => max(1.0, (float) ($structured['requirements_total'] ?? 1)),
            'has_clear_position' => (bool) ($structured['has_clear_position'] ?? false),
            'has_irrelevant_content' => (bool) ($structured['has_irrelevant_content'] ?? false),
        ];
    }

    /** @return list<string> */
    private function detectedLinkingWords(string $text): array
    {
        static $words = [
            'however', 'moreover', 'furthermore', 'therefore', 'consequently',
            'nevertheless', 'although', 'despite', 'in addition', 'on the other hand',
            'firstly', 'secondly', 'finally', 'in conclusion', 'for example',
            'as a result', 'in contrast', 'meanwhile', 'similarly',
        ];

        $found = [];
        $lower = strtolower($text);
        foreach ($words as $w) {
            if (str_contains($lower, $w)) {
                $found[] = $w;
            }
        }

        return $found;
    }
}
