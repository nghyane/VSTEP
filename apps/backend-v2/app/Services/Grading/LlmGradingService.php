<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\Ai\AiClient;
use App\Models\GradingRubric;
use Illuminate\Support\Facades\Log;

/**
 * Shared LLM grading client.
 *
 * Prompt + schema derived from GradingRubric entity.
 * Throws on hard failure so caller (strategy) can decide retry vs fallback.
 */
final class LlmGradingService implements LlmGrader
{
    public function __construct(
        private readonly AiClient $ai,
    ) {}

    public function gradeWriting(string $text, string $promptText, array $grammarErrors, array $ruleAnalysis, GradingRubric $rubric): array
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

        return $this->callStructured($prompt, $rubric);
    }

    public function gradeSpeaking(string $transcript, GradingRubric $rubric): array
    {
        $prompt = view('ai.grading.speaking', [
            'transcript' => $transcript,
        ])->render();

        return $this->callStructured($prompt, $rubric);
    }

    private function callStructured(string $prompt, GradingRubric $rubric): array
    {
        $schema = $this->schemaFromRubric($rubric);
        $instructions = view('ai.grading.system-instruction', ['rubric' => $rubric])->render();
        $fallback = $this->defaultFromRubric($rubric);

        $structured = $this->ai->structured(
            service: 'grading',
            prompt: $prompt,
            schema: $schema,
            instructions: $instructions,
        );

        if (! isset($structured['rubric_scores'])) {
            Log::warning('LLM grading: invalid structured output', [
                'response_keys' => array_keys($structured),
            ]);

            throw new \RuntimeException('LLM returned invalid structured output');
        }

        return $this->normalize(array_merge($fallback, $structured), $rubric);
    }

    /**
     * @param  array<string,mixed>  $result
     * @return array<string,mixed>
     */
    private function normalize(array $result, GradingRubric $rubric): array
    {
        $rubricScores = is_array($result['rubric_scores'] ?? null) ? $result['rubric_scores'] : [];
        $maxScoreMap = [];
        foreach ($rubric->criteria as $criterion) {
            $maxScoreMap[$criterion['key']] = (float) $criterion['max_score'];
        }

        // Clamp each score to [0, max_score] for that criterion.
        $clamped = [];
        foreach ($maxScoreMap as $key => $max) {
            $value = $rubricScores[$key] ?? ($max / 2);
            $clamped[$key] = is_numeric($value)
                ? max(0.0, min($max, (float) $value))
                : $max / 2;
        }

        $result['rubric_scores'] = $clamped;
        $result['overall_band'] = is_numeric($result['overall_band'] ?? null)
            ? (float) $result['overall_band']
            : 5.0;
        $result['strengths'] = array_values(array_filter(
            (array) ($result['strengths'] ?? []),
            fn ($item) => is_string($item) && $item !== '',
        ));
        $result['rewrites'] = array_values(is_array($result['rewrites'] ?? null) ? $result['rewrites'] : []);
        $result['annotations'] = array_values(is_array($result['annotations'] ?? null) ? $result['annotations'] : []);
        $result['improvements'] = $this->normalizeImprovements($result['improvements'] ?? []);

        return $result;
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
    private function schemaFromRubric(GradingRubric $rubric): array
    {
        return [
            'rubric_scores' => $rubric->toRubricScoresSchema(),
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
    private function defaultFromRubric(GradingRubric $rubric): array
    {
        $scores = [];
        foreach ($rubric->criteria as $criterion) {
            $scores[$criterion['key']] = (float) $criterion['max_score'] / 2;
        }

        return [
            'rubric_scores' => $scores,
            'overall_band' => 5.0,
            'strengths' => [],
            'improvements' => [],
            'rewrites' => [],
            'annotations' => [],
        ];
    }
}
