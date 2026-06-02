<?php

declare(strict_types=1);

namespace App\Services;

use App\Assessment\Enums\AssessmentSkill;
use App\Assessment\Enums\AssessmentTaskType;
use App\Models\AssessmentAttempt;
use App\Services\Grading\RubricResolver;

final class AssessmentDiagnosticsService
{
    private const MAX_ANNOTATIONS = 100;

    public function __construct(
        private readonly RubricResolver $rubricResolver,
    ) {}

    /** @return array<string,mixed> */
    public function forAttempt(AssessmentAttempt $attempt): array
    {
        $attempt->loadMissing('evidence');

        $signals = $attempt->evidence?->signals ?? [];
        $hasVocabularyMetrics = array_key_exists('vocabulary', $signals);
        $hasGrammarDiagnostics = array_key_exists('grammar', $signals);
        $metrics = (array) ($signals['vocabulary'] ?? []);
        $grammar = (array) ($signals['grammar'] ?? []);
        $errors = array_values((array) ($grammar['errors'] ?? []));
        $annotations = array_values((array) ($grammar['annotations'] ?? []));
        $text = $this->responseText($attempt);
        $normalizedAnnotations = $this->annotations($annotations, $errors, $text);
        $evidence = (array) ($attempt->evidence?->evidence ?? []);
        $taskEvidence = (array) ($evidence['task'] ?? []);
        $contentEvidence = (array) ($evidence['content'] ?? []);

        $diagnostics = [
            'summary' => $this->summary($metrics, $normalizedAnnotations, $hasGrammarDiagnostics),
            'data_status' => [
                'vocabulary_metrics_available' => $hasVocabularyMetrics,
                'grammar_diagnostics_available' => $hasGrammarDiagnostics,
            ],
            'annotations' => $normalizedAnnotations,
            'by_type' => [
                'spelling' => $this->filterByType($normalizedAnnotations, 'spelling'),
                'grammar' => $this->filterByType($normalizedAnnotations, 'grammar'),
                'punctuation' => $this->filterByType($normalizedAnnotations, 'punctuation'),
                'style' => $this->filterByType($normalizedAnnotations, 'style'),
                'other' => $this->filterByType($normalizedAnnotations, 'other'),
            ],
            'counts_by_category' => $this->countsByCategory($normalizedAnnotations),
        ];

        if ($attempt->skill === AssessmentSkill::Writing) {
            $raw = (array) ($signals['raw'] ?? []);
            $profanity = (array) ($raw['profanity'] ?? []);

            return [
                ...$diagnostics,
                'data_status' => [
                    ...$diagnostics['data_status'],
                    'task_evidence_available' => $taskEvidence !== [],
                    'format_metrics_available' => $hasVocabularyMetrics,
                ],
                'word_requirement' => $this->wordRequirement($attempt, $metrics, $taskEvidence),
                'task_coverage' => $this->taskCoverage($attempt, $taskEvidence),
                'format' => $this->writingFormat($attempt, $metrics),
                'cohesion' => $this->cohesion($metrics),
                'vocabulary_profile' => $this->vocabularyProfile($metrics),
                'profanity' => $this->profanity($profanity),
            ];
        }

        if ($attempt->skill === AssessmentSkill::Speaking) {
            $speech = (array) ($signals['speech'] ?? []);
            $pronunciation = (array) ($signals['pronunciation'] ?? []);

            return [
                ...$diagnostics,
                'data_status' => [
                    ...$diagnostics['data_status'],
                    'speech_metrics_available' => array_key_exists('speech', $signals),
                    'pronunciation_metrics_available' => array_key_exists('pronunciation', $signals),
                    'content_evidence_available' => $contentEvidence !== [],
                ],
                'speech' => $this->speech($speech),
                'fluency' => $this->fluency($speech),
                'pronunciation' => $this->pronunciation($pronunciation),
                'content' => $this->content($contentEvidence),
                'cohesion' => $this->cohesion($metrics),
            ];
        }

        return $diagnostics;
    }

    /**
     * @param  array<string,mixed>  $metrics
     * @param  list<array<string,mixed>>  $annotations
     * @return array<string,mixed>
     */
    private function summary(array $metrics, array $annotations, bool $hasGrammarDiagnostics): array
    {
        return [
            'word_count' => $this->nullableInt($metrics, 'word_count'),
            'sentence_count' => $this->nullableInt($metrics, 'sentence_count'),
            'paragraph_count' => $this->nullableInt($metrics, 'paragraph_count'),
            'total_error_count' => $this->errorCount($metrics, $annotations, $hasGrammarDiagnostics, null),
            'grammar_error_count' => $this->errorCount($metrics, $annotations, $hasGrammarDiagnostics, 'grammar'),
            'spelling_error_count' => $this->errorCount($metrics, $annotations, $hasGrammarDiagnostics, 'spelling'),
            'punctuation_error_count' => $this->errorCount($metrics, $annotations, $hasGrammarDiagnostics, 'punctuation'),
            'linking_word_count' => $this->nullableInt($metrics, 'linking_word_count'),
            'unique_ratio' => $this->nullableFloat($metrics, 'unique_ratio'),
            'avg_word_length' => $this->nullableFloat($metrics, 'avg_word_length'),
            'readability_grade' => $this->nullableFloat($metrics, 'readability_grade'),
        ];
    }

    /** @param array<string,mixed> $metrics @param array<string,mixed> $taskEvidence @return array<string,mixed> */
    private function wordRequirement(AssessmentAttempt $attempt, array $metrics, array $taskEvidence): array
    {
        try {
            $params = $this->rubricResolver->active('writing')->taskFulfillmentParams();
            $minimum = $attempt->task_type === AssessmentTaskType::WritingTask1Letter
                ? $params->wordMinimumTask1
                : $params->wordMinimumTask2;
        } catch (\RuntimeException|\InvalidArgumentException) {
            return [
                'minimum' => null,
                'actual' => null,
                'is_met' => null,
                'missing' => null,
            ];
        }

        $actual = $this->nullableInt($taskEvidence, 'word_count') ?? $this->nullableInt($metrics, 'word_count');

        return [
            'minimum' => $minimum,
            'actual' => $actual,
            'is_met' => $actual === null ? null : $actual >= $minimum,
            'missing' => $actual === null ? null : max(0, $minimum - $actual),
        ];
    }

    /** @param array<string,mixed> $taskEvidence @return array<string,mixed> */
    private function taskCoverage(AssessmentAttempt $attempt, array $taskEvidence): array
    {
        $requirements = array_values(array_filter((array) ($attempt->prompt['requirements'] ?? []), 'is_string'));
        $requirementsMet = array_values(array_filter((array) ($taskEvidence['requirements_met'] ?? []), 'is_bool'));
        $required = $this->nullableInt($taskEvidence, 'points_required') ?? count($requirements);
        $covered = $this->nullableInt($taskEvidence, 'points_covered');
        $hasDetails = $requirements !== [] && count($requirementsMet) >= count($requirements);
        $coverageRatio = $required > 0 && $covered !== null ? round($covered / $required, 3) : null;

        return [
            'required_points' => $required,
            'covered_points' => $covered,
            'coverage_ratio' => $coverageRatio,
            'has_requirement_details' => $hasDetails,
            'requirements' => array_map(fn (string $requirement, int $index): array => [
                'text' => $requirement,
                'met' => $hasDetails ? $requirementsMet[$index] : null,
            ], $requirements, array_keys($requirements)),
        ];
    }

    /** @param array<string,mixed> $metrics @return array<string,mixed> */
    private function writingFormat(AssessmentAttempt $attempt, array $metrics): array
    {
        $toneSignals = (array) ($metrics['tone_signals'] ?? []);

        return [
            'letter_format_expected' => $attempt->task_type === AssessmentTaskType::WritingTask1Letter,
            'has_salutation' => $this->nullableBool($metrics, 'has_salutation'),
            'has_closing' => $this->nullableBool($metrics, 'has_closing'),
            'tone' => [
                'formal_count' => $this->nullableInt($toneSignals, 'formal_count'),
                'informal_count' => $this->nullableInt($toneSignals, 'informal_count'),
                'informal_words' => array_key_exists('informal_words', $toneSignals)
                    ? array_values(array_filter((array) $toneSignals['informal_words'], 'is_string'))
                    : null,
            ],
        ];
    }

    /** @param array<string,mixed> $metrics @return array<string,mixed> */
    private function cohesion(array $metrics): array
    {
        return [
            'linking_word_count' => $this->nullableInt($metrics, 'linking_word_count'),
            'sentence_variety' => $this->nullableFloat($metrics, 'sentence_variety'),
        ];
    }

    /** @param array<string,mixed> $metrics @return array<string,mixed> */
    private function vocabularyProfile(array $metrics): array
    {
        return [
            'cefr_weighted_avg' => $this->nullableFloat($metrics, 'cefr_weighted_avg'),
            'cefr_advanced_ratio' => $this->nullableFloat($metrics, 'cefr_advanced_ratio'),
            'cefr_vocab_count' => $this->nullableInt($metrics, 'cefr_vocab_count'),
            'complex_vocab_count' => $this->nullableInt($metrics, 'complex_vocab_count'),
        ];
    }

    /** @param array<string,mixed> $profanity @return array<string,mixed> */
    private function profanity(array $profanity): array
    {
        return [
            'found' => (bool) ($profanity['found'] ?? false),
            'words' => array_values((array) ($profanity['words'] ?? [])),
            'count' => (int) ($profanity['count'] ?? 0),
        ];
    }

    /** @param array<string,mixed> $speech @return array<string,mixed> */
    private function speech(array $speech): array
    {
        return [
            'transcript' => is_string($speech['transcript'] ?? null) ? $speech['transcript'] : null,
            'confidence' => $this->nullableFloat($speech, 'confidence'),
            'speaking_rate' => $this->nullableFloat($speech, 'speaking_rate'),
            'pause_count' => $this->nullableInt($speech, 'pause_count'),
            'word_count' => $this->nullableInt($speech, 'word_count'),
        ];
    }

    /** @param array<string,mixed> $speech @return array<string,mixed> */
    private function fluency(array $speech): array
    {
        return [
            'speaking_rate' => $this->nullableFloat($speech, 'speaking_rate'),
            'pause_count' => $this->nullableInt($speech, 'pause_count'),
            'word_count' => $this->nullableInt($speech, 'word_count'),
        ];
    }

    /** @param array<string,mixed> $pronunciation @return array<string,mixed> */
    private function pronunciation(array $pronunciation): array
    {
        return [
            'overall' => $this->nullableFloat($pronunciation, 'overall'),
            'raw' => $pronunciation,
        ];
    }

    /** @param array<string,mixed> $contentEvidence @return array<string,mixed> */
    private function content(array $contentEvidence): array
    {
        return [
            'content_factor' => $this->nullableFloat($contentEvidence, 'content_factor'),
        ];
    }

    /** @param array<string,mixed> $data */
    private function nullableFloat(array $data, string $key): ?float
    {
        return is_numeric($data[$key] ?? null) ? (float) $data[$key] : null;
    }

    /** @param array<string,mixed> $data */
    private function nullableInt(array $data, string $key): ?int
    {
        return is_numeric($data[$key] ?? null) ? (int) $data[$key] : null;
    }

    /** @param array<string,mixed> $data */
    private function nullableBool(array $data, string $key): ?bool
    {
        return is_bool($data[$key] ?? null) ? $data[$key] : null;
    }

    /** @param array<string,mixed> $metrics @param list<array<string,mixed>> $annotations */
    private function errorCount(array $metrics, array $annotations, bool $hasGrammarDiagnostics, ?string $type): ?int
    {
        $metricKey = $type === null ? 'total_error_count' : "{$type}_error_count";
        $metricValue = $this->nullableInt($metrics, $metricKey);
        if ($metricValue !== null) {
            return $metricValue;
        }

        if (! $hasGrammarDiagnostics) {
            return null;
        }

        return $type === null ? count($annotations) : $this->countByType($annotations, $type);
    }

    /**
     * @param  list<array<string,mixed>>  $annotations
     * @param  list<array<string,mixed>>  $errors
     * @return list<array<string,mixed>>
     */
    private function annotations(array $annotations, array $errors, string $text): array
    {
        $result = [];
        foreach (array_slice($annotations, 0, self::MAX_ANNOTATIONS) as $index => $annotation) {
            $start = max(0, (int) ($annotation['start'] ?? 0));
            $end = max($start, (int) ($annotation['end'] ?? $start));
            $error = (array) ($errors[$index] ?? []);
            $category = (string) ($annotation['category'] ?? $error['category'] ?? 'unknown');
            $replacements = array_values(array_filter((array) ($error['replacements'] ?? []), 'is_string'));

            $result[] = [
                'start' => $start,
                'end' => $end,
                'length' => $end - $start,
                'text' => mb_substr($text, $start, $end - $start),
                'type' => $this->type($category),
                'severity' => (string) ($annotation['severity'] ?? 'error'),
                'category' => $category,
                'message' => (string) ($annotation['message'] ?? $error['message'] ?? ''),
                'suggestions' => $replacements !== [] ? $replacements : array_values(array_filter([(string) ($annotation['suggestion'] ?? '')])),
                'rule_id' => (string) ($error['rule_id'] ?? ''),
            ];
        }

        return $result;
    }

    private function responseText(AssessmentAttempt $attempt): string
    {
        $payload = $attempt->response_payload ?? [];
        if (is_string($payload['text'] ?? null)) {
            return $payload['text'];
        }

        $signals = $attempt->evidence?->signals ?? [];

        return (string) ($signals['speech']['transcript'] ?? '');
    }

    private function type(string $category): string
    {
        $category = strtolower($category);

        return match (true) {
            str_contains($category, 'typo') || str_contains($category, 'spelling') => 'spelling',
            str_contains($category, 'grammar') => 'grammar',
            str_contains($category, 'punctuation') => 'punctuation',
            str_contains($category, 'style') => 'style',
            default => 'other',
        };
    }

    /** @param list<array<string,mixed>> $annotations */
    private function countByType(array $annotations, string $type): int
    {
        return count($this->filterByType($annotations, $type));
    }

    /** @param list<array<string,mixed>> $annotations @return list<array<string,mixed>> */
    private function filterByType(array $annotations, string $type): array
    {
        return array_values(array_filter($annotations, fn (array $annotation): bool => ($annotation['type'] ?? null) === $type));
    }

    /** @param list<array<string,mixed>> $annotations @return array<string,int> */
    private function countsByCategory(array $annotations): array
    {
        $counts = [];
        foreach ($annotations as $annotation) {
            $category = (string) ($annotation['category'] ?? 'unknown');
            $counts[$category] = ($counts[$category] ?? 0) + 1;
        }

        ksort($counts);

        return $counts;
    }
}
