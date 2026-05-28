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
        $wordCount = str_word_count($text);
        $grammarErrors = array_slice($grammarErrors, 0, 10);

        $prompt = view('ai.grading.writing-evidence', [
            'promptText' => $promptText,
            'text' => $text,
            'wordCount' => $wordCount,
            'grammarErrors' => $grammarErrors,
            'metrics' => $ruleAnalysis['metrics'] ?? [],
            'syntax' => $ruleAnalysis['syntax'] ?? null,
            'linkingWords' => $this->detectedLinkingWords($text),
            'requirements' => $requirements,
            'part' => $part,
        ])->render();

        $reqKeys = $this->buildRequirementKeys($requirements);

        // LLM: binary YES/NO per requirement (simplest possible output)
        $structured = $this->ai->toolCall(
            service: 'grading',
            prompt: $prompt,
            toolName: 'check_requirements',
            toolDescription: 'For each requirement, answer YES if the essay addresses it, NO if not.',
            parametersSchema: [
                'requirements' => ['type' => 'array', 'items' => [
                    'type' => 'object',
                    'properties' => [
                        'key' => ['type' => 'string'],
                        'met' => ['type' => 'boolean'],
                    ],
                    'required' => ['key', 'met'],
                    'additionalProperties' => false,
                ]],
            ],
            instructions: 'You are grading a VSTEP essay against task requirements. '
                .'Read the full essay carefully. For each requirement, answer YES or NO only. '
                .'A requirement is met if the essay addresses the topic, even briefly.',
        );

        $metCount = 0;
        $total = max(1, count($reqKeys));
        foreach ($reqKeys as $key) {
            $llmReqs = $structured['requirements'] ?? [];
            $found = false;
            foreach ($llmReqs as $r) {
                if (($r['key'] ?? '') === $key && ($r['met'] ?? false)) {
                    $found = true;
                    break;
                }
            }
            if ($found) {
                $metCount++;
            }
        }

        // Deterministic depth/examples/position (no LLM needed)
        $depthFactor = $wordCount > 0 ? min(1.0, $wordCount / 250) : 0;
        $lowerText = strtolower($text);
        $hasExamples = str_contains($lowerText, 'for example')
            || str_contains($lowerText, 'for instance')
            || str_contains($lowerText, 'such as');
        $hasPosition = str_contains($lowerText, 'i believe')
            || str_contains($lowerText, 'i think')
            || str_contains($lowerText, 'in my opinion')
            || str_contains($lowerText, 'i agree')
            || str_contains($lowerText, 'i disagree')
            || str_contains($lowerText, 'in conclusion');

        return [
            'points_covered' => $metCount,
            'points_required' => $total,
            'depth_factor' => round($depthFactor, 2),
            'has_examples' => $hasExamples,
            'has_clear_position' => $hasPosition,
            'has_irrelevant_content' => false, // LLM doesn't check this with binary approach
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
