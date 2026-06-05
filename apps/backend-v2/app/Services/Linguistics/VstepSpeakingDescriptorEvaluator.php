<?php

declare(strict_types=1);

namespace App\Services\Linguistics;

final class VstepSpeakingDescriptorEvaluator
{
    /** @param array<string,mixed> $features @return array{descriptors:array<string,bool>,score:float} */
    public function evaluate(string $taskType, array $features): array
    {
        $normalizedTaskType = $this->normalizeTaskType($taskType);
        $rules = (array) config("grading.speaking.descriptors.{$normalizedTaskType}", config('grading.speaking.descriptors.speaking_part_2', []));
        $descriptors = [];

        foreach ($rules as $key => $conditions) {
            $descriptors[(string) $key] = $this->conditionsMet((array) $conditions, $features);
        }

        return $this->score($descriptors);
    }

    /** @param array<string,mixed> $features @param array<string,mixed> $syntax @param array<string,mixed> $metrics */
    public function grammarVocabularyScore(float $grammar, float $vocabulary, array $features, array $syntax, array $metrics, string $taskType = ''): float
    {
        $config = (array) config('grading.speaking.criterion_caps.'.$this->normalizeTaskType($taskType), []);

        $grammarLowSyntaxCap = (array) ($config['grammar']['low_syntax_cap'] ?? []);
        if ($grammarLowSyntaxCap !== [] && (int) ($syntax['count'] ?? 0) <= (int) ($grammarLowSyntaxCap['syntax_count_lte'] ?? -1)) {
            $grammar = min($grammar, (float) $grammarLowSyntaxCap['cap']);
        }

        $vocabularyCap = (array) ($config['vocabulary']['low_advanced_topic_cap'] ?? []);
        if ($vocabularyCap !== []
            && (float) ($metrics['cefr_advanced_ratio'] ?? 0.0) < (float) $vocabularyCap['advanced_ratio_lt']
            && (int) ($features['topic_lexis'] ?? 0) < (int) $vocabularyCap['topic_lexis_lt']) {
            $vocabulary = min($vocabulary, (float) $vocabularyCap['cap']);
        }

        return $this->clampRound(($grammar + $vocabulary) / 2);
    }

    /** @param array<string,bool> $descriptors @return array{descriptors:array<string,bool>,score:float} */
    private function score(array $descriptors): array
    {
        $met = count(array_filter($descriptors));
        $bands = (array) config('grading.speaking.descriptor_bands', []);
        $score = (float) ($bands[min($met, max(0, count($bands) - 1))] ?? 8.0);

        return ['descriptors' => $descriptors, 'score' => $score];
    }

    /** @param array<string,mixed>|list<array<string,mixed>> $conditions @param array<string,mixed> $features */
    private function conditionsMet(array $conditions, array $features): bool
    {
        if (isset($conditions['any']) && is_array($conditions['any'])) {
            return collect($conditions['any'])->contains(fn (array $group): bool => $this->conditionsMet($group, $features));
        }

        foreach ($conditions as $condition) {
            if (! is_array($condition) || ! $this->conditionMet($condition, $features)) {
                return false;
            }
        }

        return true;
    }

    /** @param array<string,mixed> $condition @param array<string,mixed> $features */
    private function conditionMet(array $condition, array $features): bool
    {
        $actual = (float) ($features[(string) $condition['feature']] ?? 0.0);
        $expected = (float) $condition['value'];

        return match ((string) $condition['operator']) {
            '>=' => $actual >= $expected,
            '>' => $actual > $expected,
            '<=' => $actual <= $expected,
            '<' => $actual < $expected,
            '==' => $actual === $expected,
            default => false,
        };
    }

    private function clampRound(float $value): float
    {
        return round(max(1.0, min(10.0, $value)) * 2) / 2;
    }

    private function normalizeTaskType(string $taskType): string
    {
        return match ($taskType) {
            'speaking_part_1_personal' => 'speaking_part_1',
            'speaking_part_2_solution' => 'speaking_part_2',
            'speaking_part_3_discussion' => 'speaking_part_3',
            default => $taskType,
        };
    }
}
