<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AssessmentAttempt;

final class AssessmentDiagnosticsService
{
    private const MAX_ANNOTATIONS = 100;

    /** @return array<string,mixed> */
    public function forAttempt(AssessmentAttempt $attempt): array
    {
        $attempt->loadMissing('evidence');

        $signals = $attempt->evidence?->signals ?? [];
        $metrics = (array) ($signals['vocabulary'] ?? []);
        $grammar = (array) ($signals['grammar'] ?? []);
        $errors = array_values((array) ($grammar['errors'] ?? []));
        $annotations = array_values((array) ($grammar['annotations'] ?? []));
        $text = $this->responseText($attempt);
        $normalizedAnnotations = $this->annotations($annotations, $errors, $text);

        return [
            'summary' => [
                'word_count' => (int) ($metrics['word_count'] ?? 0),
                'sentence_count' => (int) ($metrics['sentence_count'] ?? 0),
                'paragraph_count' => (int) ($metrics['paragraph_count'] ?? 0),
                'total_error_count' => (int) ($metrics['total_error_count'] ?? count($normalizedAnnotations)),
                'grammar_error_count' => (int) ($metrics['grammar_error_count'] ?? $this->countByType($normalizedAnnotations, 'grammar')),
                'spelling_error_count' => (int) ($metrics['spelling_error_count'] ?? $this->countByType($normalizedAnnotations, 'spelling')),
                'punctuation_error_count' => (int) ($metrics['punctuation_error_count'] ?? $this->countByType($normalizedAnnotations, 'punctuation')),
                'linking_word_count' => (int) ($metrics['linking_word_count'] ?? 0),
                'unique_ratio' => (float) ($metrics['unique_ratio'] ?? 0.0),
                'avg_word_length' => (float) ($metrics['avg_word_length'] ?? 0.0),
                'readability_grade' => (float) ($metrics['readability_grade'] ?? 0.0),
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
