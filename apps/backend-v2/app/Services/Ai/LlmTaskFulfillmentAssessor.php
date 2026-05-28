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

        $reqKeys = $this->buildRequirementKeys($requirements);

        $structured = $this->ai->toolCall(
            service: 'grading',
            prompt: $prompt,
            toolName: 'extract_writing_evidence',
            toolDescription: 'Find evidence in the student text for each requirement. Quote exact sentences.',
            parametersSchema: [
                'requirements' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'key' => ['type' => 'string'],
                            'met' => ['type' => 'boolean'],
                            'evidence' => ['type' => 'string'],
                        ],
                        'required' => ['key', 'met', 'evidence'],
                        'additionalProperties' => false,
                    ],
                ],
                'has_clear_position' => ['type' => 'boolean'],
                'has_irrelevant_content' => ['type' => 'boolean'],
            ],
            instructions: 'You are a VSTEP writing evidence collector. Match requirements to text. '
                .'Quote exact sentences. Do NOT score or evaluate quality.',
        );

        $evidence = $this->normalize($structured, $reqKeys);

        $metCount = count(array_filter($evidence, fn ($r) => $r['met']));
        $total = max(1, count($reqKeys));

        $totalWords = max(1, str_word_count($text));
        $evidenceWords = array_sum(array_map(fn ($r) => str_word_count((string) ($r['evidence'] ?? '')), $evidence));
        $depthFactor = min(1.0, $evidenceWords / ($totalWords * 0.5));

        $hasExamples = str_contains(strtolower(implode(' ', array_column($evidence, 'evidence'))), 'for example')
            || str_contains(strtolower(implode(' ', array_column($evidence, 'evidence'))), 'for instance');

        return [
            'points_covered' => $metCount,
            'points_required' => $total,
            'depth_factor' => round($depthFactor, 2),
            'has_examples' => $hasExamples,
            'has_clear_position' => (bool) ($structured['has_clear_position'] ?? false),
            'has_irrelevant_content' => (bool) ($structured['has_irrelevant_content'] ?? false),
            'evidence' => $evidence,
        ];
    }

    /** @return list<string> */
    private function buildRequirementKeys(array $requirements): array
    {
        if ($requirements === []) {
            return ['requirement_1', 'requirement_2', 'requirement_3'];
        }

        return array_map(fn (int $i) => 'req_'.($i + 1), array_keys($requirements));
    }

    /**
     * @param  list<string>  $reqKeys
     * @return list<array{key: string, met: bool, evidence: string}>
     */
    private function normalize(array $structured, array $reqKeys): array
    {
        $llmReqs = $structured['requirements'] ?? [];

        if (! is_array($llmReqs)) {
            $llmReqs = [];
        }

        $byKey = [];
        foreach ($llmReqs as $r) {
            if (is_array($r) && isset($r['key'])) {
                $byKey[(string) $r['key']] = [
                    'key' => (string) $r['key'],
                    'met' => (bool) ($r['met'] ?? false),
                    'evidence' => (string) ($r['evidence'] ?? ''),
                ];
            }
        }

        $result = [];
        foreach ($reqKeys as $key) {
            $result[] = $byKey[$key] ?? ['key' => $key, 'met' => false, 'evidence' => ''];
        }

        return $result;
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
