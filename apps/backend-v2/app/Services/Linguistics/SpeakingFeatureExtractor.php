<?php

declare(strict_types=1);

namespace App\Services\Linguistics;

use Illuminate\Support\Str;

final class SpeakingFeatureExtractor
{
    public function __construct(
        private readonly SpeakingTranscriptAnalyzer $signals,
    ) {}

    /** @return array<string,mixed> */
    public function extract(string $transcript): array
    {
        $signalMetrics = $this->signals->analyze($transcript);
        $turns = $this->turns($transcript);
        $words = $this->words($transcript);
        $wordCount = count($words);
        $turnLengths = array_map(fn (string $turn): int => count($this->words($turn)), $turns);
        $turnCount = count($turns);
        $shortTurnCount = count(array_filter($turnLengths, fn (int $count): bool => $count > 0 && $count < 8));
        $longTurnCount = count(array_filter($turnLengths, fn (int $count): bool => $count >= 30));

        return [
            ...$signalMetrics,
            'word_count' => $wordCount,
            'turn_count' => $turnCount,
            'avg_turn_length' => $turnCount > 0 ? round(array_sum($turnLengths) / $turnCount, 1) : 0.0,
            'short_turn_ratio' => $turnCount > 0 ? round($shortTurnCount / $turnCount, 2) : 0.0,
            'long_turn_count' => $longTurnCount,
            'repetition_ratio' => $this->repetitionRatio($words),
            'development_count' => $this->developmentCount($transcript) + (int) $signalMetrics['topic_development'],
            'reason_example_count' => $this->reasonExampleCount($transcript),
            'position_count' => $this->positionCount($transcript),
            'comparison_count' => $this->comparisonCount($transcript),
            'cause_effect_count' => $this->causeEffectCount($transcript),
            'preference_count' => $this->preferenceCount($transcript),
            'conclusion_count' => $this->conclusionCount($transcript),
        ];
    }

    /** @return list<string> */
    private function turns(string $transcript): array
    {
        $parts = preg_split('/\n+|(?<=[.!?])\s+(?=[A-Z])/', trim($transcript), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return array_values(array_filter(array_map('trim', $parts)));
    }

    /** @return list<string> */
    private function words(string $text): array
    {
        preg_match_all('/[a-z]+(?:\'[a-z]+)?/i', Str::lower($text), $matches);

        return $matches[0] ?? [];
    }

    /** @param list<string> $words */
    private function repetitionRatio(array $words): float
    {
        if ($words === []) {
            return 0.0;
        }

        $contentWords = array_values(array_filter($words, fn (string $word): bool => mb_strlen($word) > 3));
        if ($contentWords === []) {
            return 0.0;
        }

        return round(1 - (count(array_unique($contentWords)) / count($contentWords)), 2);
    }

    private function developmentCount(string $text): int
    {
        return $this->countPatterns($text, [
            '/\bbecause\b/i',
            '/\bfor example\b/i',
            '/\bfor instance\b/i',
            '/\bthe reason\b/i',
            '/\bthis is important\b/i',
        ]);
    }

    private function reasonExampleCount(string $text): int
    {
        return $this->countPatterns($text, ['/\bbecause\b/i', '/\bfor example\b/i', '/\bfor instance\b/i', '/\bthe reason\b/i']);
    }

    private function positionCount(string $text): int
    {
        return $this->countPatterns($text, ['/\bin my opinion\b/i', '/\bi think\b/i', '/\bi believe\b/i', '/\bfrom my point of view\b/i']);
    }

    private function comparisonCount(string $text): int
    {
        return $this->countPatterns($text, ['/\bcompared with\b/i', '/\bon the other hand\b/i', '/\bhowever\b/i', '/\bwhile\b/i', '/\bboth\b/i']);
    }

    private function causeEffectCount(string $text): int
    {
        return $this->countPatterns($text, ['/\bas a result\b/i', '/\btherefore\b/i', '/\bthis leads to\b/i', '/\bso\b/i']);
    }

    private function preferenceCount(string $text): int
    {
        return $this->countPatterns($text, ['/\bi would prefer\b/i', '/\bi prefer\b/i', '/\bi choose\b/i', '/\bi like\b/i']);
    }

    private function conclusionCount(string $text): int
    {
        return $this->countPatterns($text, ['/\bto sum up\b/i', '/\boverall\b/i', '/\bin conclusion\b/i', '/\bfinally\b/i']);
    }

    /** @param list<string> $patterns */
    private function countPatterns(string $text, array $patterns): int
    {
        $count = 0;
        foreach ($patterns as $pattern) {
            $count += preg_match_all($pattern, $text) ?: 0;
        }

        return $count;
    }
}
