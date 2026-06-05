<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PracticeWritingPrompt;
use App\Services\Vocab\CefrVocabularyClassifier;
use Illuminate\Support\Str;

final class WritingRealtimeDiagnosticsService
{
    private const MAX_ANNOTATIONS = 100;

    public function __construct(
        private readonly LanguageDetector $languageDetector,
        private readonly LanguageToolService $languageTool,
        private readonly RuleBasedScoringService $ruleScoring,
        private readonly CefrVocabularyClassifier $cefrClassifier,
    ) {}

    /** @return array<string,mixed> */
    public function analyze(PracticeWritingPrompt $prompt, string $text): array
    {
        $language = $this->languageDetector->detect($text);
        $languageTool = $this->languageToolReport($text, (bool) $language['is_english']);
        $errors = $languageTool['errors'];
        $ruleAnalysis = $this->ruleScoring->analyze($text, $errors);
        $metrics = $this->withCefrMetrics($ruleAnalysis['metrics'], $text);
        $annotations = $this->annotations($text, $errors);
        $diagnostics = $this->diagnostics($prompt, $text, $metrics, $annotations, $languageTool);

        return [
            'text_hash' => sha1($text),
            'language' => $language,
            'diagnostics' => $diagnostics,
            'readiness' => $this->readiness($diagnostics, $language),
        ];
    }

    /** @return array{errors: list<array<string,mixed>>, available: bool, checked: bool, message: string|null} */
    private function languageToolReport(string $text, bool $isEnglish): array
    {
        if (! $isEnglish || trim($text) === '') {
            return ['errors' => [], 'available' => true, 'checked' => false, 'message' => null];
        }

        try {
            return ['errors' => $this->languageTool->check($text), 'available' => true, 'checked' => true, 'message' => null];
        } catch (\RuntimeException $exception) {
            return [
                'errors' => [],
                'available' => false,
                'checked' => false,
                'message' => 'Language diagnostics are temporarily unavailable: '.$exception->getMessage(),
            ];
        }
    }

    /** @param array<string,mixed> $metrics @return array<string,mixed> */
    private function withCefrMetrics(array $metrics, string $text): array
    {
        $cefr = $this->cefrClassifier->analyze($text);

        return [
            ...$metrics,
            'cefr_weighted_avg' => $cefr['cefr_weighted_avg'],
            'cefr_advanced_ratio' => $cefr['advanced_ratio'],
            'cefr_vocab_count' => $cefr['cefr_vocab_count'],
        ];
    }

    /** @param list<array<string,mixed>> $errors @return list<array<string,mixed>> */
    private function annotations(string $text, array $errors): array
    {
        $annotations = $this->languageTool->toAnnotations($text, $errors);
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

    /**
     * @param  array<string,mixed>  $metrics
     * @param  list<array<string,mixed>>  $annotations
     * @param  array{errors: list<array<string,mixed>>, available: bool, checked: bool, message: string|null}  $languageTool
     * @return array<string,mixed>
     */
    private function diagnostics(PracticeWritingPrompt $prompt, string $text, array $metrics, array $annotations, array $languageTool): array
    {
        $languageToolChecked = $languageTool['checked'];
        $hasMetrics = $metrics !== [];
        $summary = [
            'word_count' => (int) ($metrics['word_count'] ?? 0),
            'sentence_count' => (int) ($metrics['sentence_count'] ?? 0),
            'paragraph_count' => (int) ($metrics['paragraph_count'] ?? 0),
            'total_error_count' => $languageToolChecked ? (int) ($metrics['total_error_count'] ?? count($annotations)) : null,
            'grammar_error_count' => $languageToolChecked ? (int) ($metrics['grammar_error_count'] ?? $this->countByType($annotations, 'grammar')) : null,
            'spelling_error_count' => $languageToolChecked ? (int) ($metrics['spelling_error_count'] ?? $this->countByType($annotations, 'spelling')) : null,
            'punctuation_error_count' => $languageToolChecked ? (int) ($metrics['punctuation_error_count'] ?? $this->countByType($annotations, 'punctuation')) : null,
            'linking_word_count' => (int) ($metrics['linking_word_count'] ?? 0),
            'unique_ratio' => (float) ($metrics['unique_ratio'] ?? 0.0),
            'avg_word_length' => (float) ($metrics['avg_word_length'] ?? 0.0),
            'readability_grade' => (float) ($metrics['readability_grade'] ?? 0.0),
        ];

        return [
            'summary' => $summary,
            'data_status' => [
                'rule_metrics_available' => $hasMetrics,
                'language_tool_checked' => $languageToolChecked,
            ],
            'word_requirement' => [
                'minimum' => (int) $prompt->min_words,
                'actual' => $summary['word_count'],
                'is_met' => $summary['word_count'] >= (int) $prompt->min_words,
                'missing' => max(0, (int) $prompt->min_words - $summary['word_count']),
            ],
            'task_coverage' => $this->taskCoverage($prompt, $summary['word_count'], $text),
            'format' => [
                'letter_format_expected' => (int) $prompt->part === 1,
                'has_salutation' => $hasMetrics ? (bool) ($metrics['has_salutation'] ?? false) : null,
                'has_closing' => $hasMetrics ? (bool) ($metrics['has_closing'] ?? false) : null,
                'tone' => $hasMetrics ? $this->tone($metrics) : null,
            ],
            'cohesion' => [
                'linking_word_count' => $hasMetrics ? $summary['linking_word_count'] : null,
                'sentence_variety' => $hasMetrics ? (float) ($metrics['sentence_variety'] ?? 0.0) : null,
            ],
            'vocabulary_profile' => $hasMetrics ? [
                'cefr_weighted_avg' => (float) ($metrics['cefr_weighted_avg'] ?? 0.0),
                'cefr_advanced_ratio' => (float) ($metrics['cefr_advanced_ratio'] ?? 0.0),
                'cefr_vocab_count' => (int) ($metrics['cefr_vocab_count'] ?? 0),
                'complex_vocab_count' => (int) ($metrics['complex_vocab_count'] ?? 0),
            ] : null,
            'annotations' => $annotations,
            'service_status' => [
                'language_tool' => [
                    'available' => $languageTool['available'],
                    'checked' => $languageToolChecked,
                    'message' => $languageTool['message'],
                ],
            ],
            'by_type' => [
                'spelling' => $this->filterByType($annotations, 'spelling'),
                'grammar' => $this->filterByType($annotations, 'grammar'),
                'punctuation' => $this->filterByType($annotations, 'punctuation'),
                'style' => $this->filterByType($annotations, 'style'),
                'other' => $this->filterByType($annotations, 'other'),
            ],
            'counts_by_category' => $this->countsByCategory($annotations),
        ];
    }

    /** @param array<string,mixed> $metrics @return array<string,mixed> */
    private function tone(array $metrics): array
    {
        $toneSignals = (array) ($metrics['tone_signals'] ?? []);

        return [
            'formal_count' => (int) ($toneSignals['formal_count'] ?? 0),
            'informal_count' => (int) ($toneSignals['informal_count'] ?? 0),
            'informal_words' => array_values(array_filter((array) ($toneSignals['informal_words'] ?? []), 'is_string')),
        ];
    }

    /** @return array<string,mixed> */
    private function taskCoverage(PracticeWritingPrompt $prompt, int $wordCount, string $text): array
    {
        $requirements = array_values(array_filter($prompt->required_points ?? [], 'is_string'));
        $requirementsMet = array_map(fn (string $requirement): bool => $this->likelyMet($requirement, $text), $requirements);
        $covered = count(array_filter($requirementsMet));
        $required = max(1, count($requirements));

        if ($wordCount === 0) {
            $requirementsMet = array_fill(0, count($requirements), false);
            $covered = 0;
        }

        return [
            'required_points' => $required,
            'covered_points' => $covered,
            'coverage_ratio' => round($covered / $required, 3),
            'has_requirement_details' => $requirements !== [],
            'source' => 'heuristic',
            'requirements' => array_map(fn (string $requirement, int $index): array => [
                'text' => $requirement,
                'met' => $requirementsMet[$index] ?? false,
            ], $requirements, array_keys($requirements)),
        ];
    }

    private function likelyMet(string $requirement, string $text): bool
    {
        $normalizedRequirement = $this->normalize($requirement);
        $words = array_values(array_filter(
            preg_split('/\s+/', $normalizedRequirement) ?: [],
            fn (string $word): bool => mb_strlen($word) >= 4,
        ));

        if ($words === []) {
            return false;
        }

        $normalizedText = $this->normalize($text);
        $hits = count(array_filter($words, fn (string $word): bool => str_contains($normalizedText, $word)));

        return $hits / count($words) >= 0.35;
    }

    private function normalize(string $value): string
    {
        return Str::of($value)
            ->lower()
            ->ascii()
            ->replaceMatches('/[^a-z0-9\s]+/', ' ')
            ->squish()
            ->toString();
    }

    /** @param array<string,mixed> $diagnostics @param array<string,mixed> $language @return array<string,mixed> */
    private function readiness(array $diagnostics, array $language): array
    {
        $reasons = [];
        $wordRequirement = (array) $diagnostics['word_requirement'];
        $format = (array) $diagnostics['format'];
        $summary = (array) $diagnostics['summary'];

        if (! (bool) ($language['is_english'] ?? true)) {
            $reasons[] = ['code' => 'non_english', 'message' => 'Bài hiện chưa giống tiếng Anh.'];
        }
        if (! $wordRequirement['is_met']) {
            $reasons[] = ['code' => 'word_count', 'message' => 'Cần viết thêm '.$wordRequirement['missing'].' từ để đạt yêu cầu tối thiểu.'];
        }
        if ($format['letter_format_expected'] && ! $format['has_salutation']) {
            $reasons[] = ['code' => 'missing_salutation', 'message' => 'Thư đang thiếu lời chào.'];
        }
        if ($format['letter_format_expected'] && ! $format['has_closing']) {
            $reasons[] = ['code' => 'missing_closing', 'message' => 'Thư đang thiếu lời kết.'];
        }
        $serviceStatus = (array) ($diagnostics['service_status'] ?? []);
        $languageTool = (array) ($serviceStatus['language_tool'] ?? []);
        if (($languageTool['available'] ?? true) === false) {
            $reasons[] = ['code' => 'language_check_unavailable', 'message' => 'Chưa kiểm tra được lỗi ngôn ngữ tự động.'];
        }
        if (is_int($summary['total_error_count']) && $summary['total_error_count'] > 0) {
            $reasons[] = ['code' => 'language_errors', 'message' => 'Có '.$summary['total_error_count'].' lỗi ngôn ngữ cần xem lại.'];
        }

        return [
            'status' => $reasons === [] ? 'ready' : 'needs_work',
            'label' => $reasons === [] ? 'Sẵn sàng nộp' : 'Cần hoàn thiện trước khi nộp',
            'reasons' => $reasons,
        ];
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
