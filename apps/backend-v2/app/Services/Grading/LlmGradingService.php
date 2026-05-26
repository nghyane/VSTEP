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
        $grammarErrors = array_slice($grammarErrors, 0, 10);

        $prompt = view('ai.grading.writing', [
            'promptText' => $promptText,
            'text' => $text,
            'wordCount' => str_word_count($text),
            'grammarErrors' => $grammarErrors,
            'metrics' => $ruleAnalysis['metrics'] ?? [],
            'syntax' => $ruleAnalysis['syntax'] ?? null,
        ])->render();

        return $this->callStructured($prompt, $rubric);
    }

    public function gradeSpeaking(string $transcript, GradingRubric $rubric, ?array $pronunciationData = null): array
    {
        $prompt = view('ai.grading.speaking', [
            'transcript' => $transcript,
            'pronunciationScore' => $pronunciationData['accuracy_score'] ?? null,
        ])->render();

        return $this->callStructured($prompt, $rubric);
    }

    /**
     * Extract structured evidence from writing (not scores).
     *
     * LLM observes text and returns countable facts, not subjective scores.
     * Formula computes scores deterministically from evidence.
     *
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

        // The ONLY LLM input: did the student answer the task correctly?
        // Everything else is deterministic (syntax counter, metrics, LanguageTool).
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

        // Map flat fields to nested evidence structure
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

    private function callStructured(string $prompt, GradingRubric $rubric): array
    {
        $schema = $this->schemaFromRubric($rubric);
        $instructions = view('ai.grading.system-instruction', ['rubric' => $rubric])->render();
        $fallback = $this->defaultFromRubric($rubric);

        $structured = $this->ai->toolCall(
            service: 'grading',
            prompt: $prompt,
            toolName: "grade_{$rubric->skill}_response",
            toolDescription: "Submit the grading result for a VSTEP {$rubric->skill} assessment. Call this function once with the complete evaluation.",
            parametersSchema: $schema,
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
