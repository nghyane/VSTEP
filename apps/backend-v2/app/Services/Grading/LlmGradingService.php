<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\Ai\Agents\StructuredGradingAgent;
use Illuminate\Support\Facades\Log;
use Laravel\Ai\Responses\StructuredAgentResponse;

/**
 * Shared LLM grading client.
 *
 * Encapsulates: prompt template + structured response + normalization.
 * Throws on hard failure so caller (strategy) can decide retry vs fallback.
 */
final class LlmGradingService implements LlmGrader
{
    public function __construct(
        private readonly StructuredGradingAgent $agent,
    ) {}

    private function model(): string
    {
        return (string) config('grading.llm.model', 'gemini-3-flash-preview');
    }

    /**
     * @param  array<int,array<string,mixed>>  $grammarErrors
     * @param  array{caps: array<string,float|null>, metrics: array<string,mixed>, flags: list<string>}  $ruleAnalysis
     * @return array{rubric_scores: array<string,float>, overall_band: float, strengths: list<string>, improvements: list<array<string,mixed>>, rewrites: list<array<string,mixed>>, annotations: list<array<string,mixed>>}
     */
    public function gradeWriting(string $text, string $promptText, array $grammarErrors, array $ruleAnalysis): array
    {
        $context = $this->buildWritingContext($grammarErrors, $ruleAnalysis);
        $userMessage = "Task prompt: {$promptText}\n\nStudent's writing:\n{$text}\n\nWord count: ".str_word_count($text).$context;

        return $this->callStructured($userMessage, $this->defaultWritingResult());
    }

    /**
     * @return array{rubric_scores: array<string,float>, overall_band: float, strengths: list<string>, improvements: list<array<string,mixed>>}
     */
    public function gradeSpeaking(string $transcript): array
    {
        return $this->callStructured("Transcript:\n{$transcript}", $this->defaultSpeakingResult());
    }

    /**
     * @param  array<string,mixed>  $fallback
     * @return array<string,mixed>
     */
    private function callStructured(string $prompt, array $fallback): array
    {
        $response = $this->agent->prompt(
            prompt: $prompt,
            provider: 'llm',
            model: $this->model(),
        );

        $structured = $response instanceof StructuredAgentResponse
            ? $response->structured
            : [];

        if (! is_array($structured) || ! isset($structured['rubric_scores'])) {
            Log::warning('LLM grading: invalid structured output', [
                'model' => $this->model(),
                'response_type' => get_debug_type($structured),
            ]);

            throw new \RuntimeException('LLM returned invalid structured output');
        }

        return $this->normalize(array_merge($fallback, $structured), $fallback);
    }

    /**
     * @param  array<int,array<string,mixed>>  $grammarErrors
     * @param  array<string,mixed>  $ruleAnalysis
     */
    private function buildWritingContext(array $grammarErrors, array $ruleAnalysis): string
    {
        $context = '';
        if (! empty($grammarErrors)) {
            $errorSummary = array_map(
                fn ($e) => "- \"{$e['message']}\" (offset {$e['offset']})",
                array_slice($grammarErrors, 0, 10),
            );
            $context = "\n\nGrammar errors detected by automated checker:\n".implode("\n", $errorSummary);
        }

        $metrics = $ruleAnalysis['metrics'];
        $context .= "\n\nText metrics:";
        $context .= "\n- Words: {$metrics['word_count']}, Sentences: {$metrics['sentence_count']}, Paragraphs: {$metrics['paragraph_count']}";
        $context .= "\n- Errors/sentence: {$metrics['errors_per_sentence']}, Unique word ratio: {$metrics['unique_ratio']}";
        $context .= "\n- Linking words found: {$metrics['linking_word_count']}";

        $capContext = array_filter($ruleAnalysis['caps'], fn ($v) => $v !== null);
        if (! empty($capContext)) {
            $context .= "\n\nScore constraints (do NOT exceed these):";
            foreach ($capContext as $criterion => $cap) {
                $context .= "\n- {$criterion} max: {$cap}";
            }
        }

        return $context;
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

    /**
     * @return array<string,mixed>
     */
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

    /**
     * @return array<string,mixed>
     */
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
