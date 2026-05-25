<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\Ai\AiClient;
use Illuminate\Support\Facades\Log;

/**
 * Shared LLM grading client.
 *
 * Encapsulates: prompt template + structured response + normalization.
 * Throws on hard failure so caller (strategy) can decide retry vs fallback.
 */
final class LlmGradingService implements LlmGrader
{
    public function __construct(
        private readonly AiClient $ai,
    ) {}

    /**
     * @param  array<int,array<string,mixed>>  $grammarErrors
     * @param  array{caps: array<string,float|null>, metrics: array<string,mixed>, flags: list<string>}  $ruleAnalysis
     * @return array{rubric_scores: array<string,float>, overall_band: float, strengths: list<string>, improvements: list<array<string,mixed>>, rewrites: list<array<string,mixed>>, annotations: list<array<string,mixed>>}
     */
    public function gradeWriting(string $text, string $promptText, array $grammarErrors, array $ruleAnalysis): array
    {
        $caps = array_filter($ruleAnalysis['caps'], fn ($v) => $v !== null);
        $grammarErrors = array_slice($grammarErrors, 0, 10);

        $prompt = view('ai.grading.writing', [
            'promptText' => $promptText,
            'text' => $text,
            'wordCount' => str_word_count($text),
            'grammarErrors' => $grammarErrors,
            'metrics' => $ruleAnalysis['metrics'],
            'caps' => $caps,
        ])->render();

        $schema = $this->writingSchema();

        return $this->callStructured($prompt, $schema, $this->defaultWritingResult());
    }

    /**
     * @return array{rubric_scores: array<string,float>, overall_band: float, strengths: list<string>, improvements: list<array<string,mixed>>}
     */
    public function gradeSpeaking(string $transcript): array
    {
        $prompt = view('ai.grading.speaking', ['transcript' => $transcript])->render();
        $schema = $this->speakingSchema();

        return $this->callStructured($prompt, $schema, $this->defaultSpeakingResult());
    }

    /**
     * @param  array<string,mixed>  $schema
     * @param  array<string,mixed>  $fallback
     * @return array<string,mixed>
     */
    private function callStructured(string $prompt, array $schema, array $fallback): array
    {
        $structured = $this->ai->structured(
            service: 'grading',
            prompt: $prompt,
            schema: $schema,
            instructions: $this->gradingInstructions(),
        );

        if (! isset($structured['rubric_scores'])) {
            Log::warning('LLM grading: invalid structured output', [
                'response_keys' => array_keys($structured),
            ]);

            throw new \RuntimeException('LLM returned invalid structured output');
        }

        return $this->normalize(array_merge($fallback, $structured), $fallback);
    }

    private function gradingInstructions(): string
    {
        return 'You are a VSTEP English exam grader. Score each rubric criterion from 0.0 to 4.0. Be precise and consistent.';
    }

    /**
     * @param  array<string,mixed>  $result
     * @param  array<string,mixed>  $fallback
     * @return array<string,mixed>
     */
    private function normalize(array $result, array $fallback): array
    {
        $rubricScores = is_array($result['rubric_scores'] ?? null) ? $result['rubric_scores'] : [];
        $fallbackScores = is_array($fallback['rubric_scores'] ?? null) ? $fallback['rubric_scores'] : [];

        // LLM sometimes returns synonyms — map back to canonical keys.
        $keyMap = [
            'task_completion' => 'task_achievement',
            'task_response' => 'task_achievement',
            'content' => 'task_achievement',
            'clarity' => 'coherence',
            'organization' => 'coherence',
            'style' => 'lexical',
            'vocab' => 'lexical',
            'vocabulary' => 'lexical',
        ];

        foreach ($keyMap as $from => $to) {
            if (! array_key_exists($to, $rubricScores) && array_key_exists($from, $rubricScores)) {
                $rubricScores[$to] = $rubricScores[$from];
            }
        }

        foreach ($fallbackScores as $key => $value) {
            $rubricScores[$key] = $this->clampScore($rubricScores[$key] ?? $value, $value);
        }

        $result['rubric_scores'] = $rubricScores;
        $result['overall_band'] = is_numeric($result['overall_band'] ?? null)
            ? (float) $result['overall_band']
            : 5.0;
        $result['strengths'] = array_values(array_filter(
            (array) ($result['strengths'] ?? []),
            fn ($item) => is_string($item) && $item !== '',
        ));
        $result['rewrites'] = array_values(is_array($result['rewrites'] ?? null) ? $result['rewrites'] : []);
        $result['annotations'] = array_values(is_array($result['annotations'] ?? null) ? $result['annotations'] : []);
        $result['improvements'] = $this->normalizeImprovements($result['improvements'] ?? $fallback['improvements'] ?? []);

        return $result;
    }

    private function clampScore(mixed $value, float $fallback): float
    {
        if (! is_numeric($value)) {
            return $fallback;
        }

        return max(0.0, min(4.0, (float) $value));
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
                    'message' => (string) ($item['message'] ?? $item['explanation'] ?? 'Needs improvement'),
                    'explanation' => (string) ($item['explanation'] ?? $item['message'] ?? 'Needs improvement'),
                ];
            }

            return ['message' => 'Needs improvement', 'explanation' => 'Needs improvement'];
        }, $items));
    }

    /** @return array<string,mixed> */
    private function writingSchema(): array
    {
        return [
            'rubric_scores' => [
                'type' => 'object',
                'properties' => [
                    'task_achievement' => ['type' => 'number'],
                    'coherence' => ['type' => 'number'],
                    'lexical' => ['type' => 'number'],
                    'grammar' => ['type' => 'number'],
                ],
                'required' => ['task_achievement', 'coherence', 'lexical', 'grammar'],
                'additionalProperties' => false,
            ],
            'overall_band' => ['type' => 'number'],
            'strengths' => ['type' => 'array', 'items' => ['type' => 'string']],
            'improvements' => [
                'type' => 'array',
                'items' => [
                    'type' => 'object',
                    'properties' => [
                        'message' => ['type' => 'string'],
                        'explanation' => ['type' => 'string'],
                    ],
                    'required' => ['message', 'explanation'],
                    'additionalProperties' => false,
                ],
            ],
            'rewrites' => [
                'type' => 'array',
                'items' => [
                    'type' => 'object',
                    'properties' => [
                        'original' => ['type' => 'string'],
                        'improved' => ['type' => 'string'],
                        'reason' => ['type' => 'string'],
                    ],
                    'required' => ['original', 'improved', 'reason'],
                    'additionalProperties' => false,
                ],
            ],
            'annotations' => ['type' => 'array', 'items' => ['type' => 'string']],
        ];
    }

    /** @return array<string,mixed> */
    private function speakingSchema(): array
    {
        return [
            'rubric_scores' => [
                'type' => 'object',
                'properties' => [
                    'fluency' => ['type' => 'number'],
                    'pronunciation' => ['type' => 'number'],
                    'content' => ['type' => 'number'],
                    'vocab' => ['type' => 'number'],
                    'grammar' => ['type' => 'number'],
                ],
                'required' => ['fluency', 'pronunciation', 'content', 'vocab', 'grammar'],
                'additionalProperties' => false,
            ],
            'overall_band' => ['type' => 'number'],
            'strengths' => ['type' => 'array', 'items' => ['type' => 'string']],
            'improvements' => [
                'type' => 'array',
                'items' => [
                    'type' => 'object',
                    'properties' => [
                        'message' => ['type' => 'string'],
                        'explanation' => ['type' => 'string'],
                    ],
                    'required' => ['message', 'explanation'],
                    'additionalProperties' => false,
                ],
            ],
        ];
    }

    /** @return array<string,mixed> */
    private function defaultWritingResult(): array
    {
        return [
            'rubric_scores' => ['task_achievement' => 2.0, 'coherence' => 2.0, 'lexical' => 2.0, 'grammar' => 2.0],
            'overall_band' => 5.0,
            'strengths' => [],
            'improvements' => [],
            'rewrites' => [],
            'annotations' => [],
        ];
    }

    /** @return array<string,mixed> */
    private function defaultSpeakingResult(): array
    {
        return [
            'rubric_scores' => ['fluency' => 2.0, 'pronunciation' => 2.0, 'content' => 2.0, 'vocab' => 2.0, 'grammar' => 2.0],
            'overall_band' => 5.0,
            'strengths' => [],
            'improvements' => [],
        ];
    }
}
