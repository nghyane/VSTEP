<?php

declare(strict_types=1);

namespace App\Services\Vocab;

use App\Models\CefrVocabulary;

/**
 * Classify vocabulary level in an essay using CEFR word lists.
 *
 * Replaces complex_vocab_count (45 hardcoded academic words)
 * with actual CEFR-level distribution analysis.
 */
final class CefrVocabularyClassifier
{
    /** @var array<string, string>|null word → level lookup cache */
    private ?array $lookup = null;

    /** @var array<string, int> CEFR level → numeric weight */
    private const LEVEL_WEIGHTS = [
        'A1' => 1,
        'A2' => 2,
        'B1' => 3,
        'B2' => 4,
        'C1' => 5,
    ];

    /**
     * Analyze vocabulary level distribution in text.
     *
     * @return array{cefr_distribution: array<string,float>, cefr_weighted_avg: float, advanced_ratio: float, cefr_vocab_count: int}
     */
    public function analyze(string $text): array
    {
        $words = $this->tokenizeContent($text);
        $lookup = $this->getLookup();

        $counts = ['A1' => 0, 'A2' => 0, 'B1' => 0, 'B2' => 0, 'C1' => 0];
        $classified = 0;

        foreach ($words as $word) {
            $level = $lookup[$word] ?? null;
            if ($level !== null) {
                $counts[$level]++;
                $classified++;
            }
        }

        $total = max(1, $classified);

        $distribution = [];
        foreach ($counts as $level => $count) {
            $distribution[$level] = round(($count / $total) * 100, 1);
        }

        $weightedSum = 0;
        foreach ($counts as $level => $count) {
            $weightedSum += $count * (self::LEVEL_WEIGHTS[$level] ?? 0);
        }
        $weightedAvg = round($weightedSum / $total, 2);

        $advancedCount = ($counts['B2'] ?? 0) + ($counts['C1'] ?? 0);
        $advancedRatio = round($advancedCount / $total, 2);

        return [
            'cefr_distribution' => $distribution,
            'cefr_weighted_avg' => $weightedAvg,
            'advanced_ratio' => $advancedRatio,
            'cefr_vocab_count' => $classified,
        ];
    }

    /**
     * Compute vocabulary band score (1.0–10.0) from CEFR distribution.
     *
     * Band mapping:
     *   avg < 2.0 (≈A1-A2)  → 2-4
     *   avg 2.0-2.5 (≈A2-B1) → 4-5
     *   avg 2.5-3.0 (≈B1)    → 5-6
     *   avg 3.0-3.5 (≈B1-B2) → 6-7
     *   avg 3.5-4.0 (≈B2)    → 7-8
     *   avg 4.0+   (≈B2-C1)  → 8-10
     */
    public function computeBand(array $cefrResult): float
    {
        $avg = $cefrResult['cefr_weighted_avg'];
        $advanced = $cefrResult['advanced_ratio'];

        $base = match (true) {
            $avg >= 4.0 => 8,
            $avg >= 3.5 => 7,
            $avg >= 3.0 => 6,
            $avg >= 2.5 => 5,
            $avg >= 2.0 => 4,
            default => 3,
        };

        $bonus = match (true) {
            $advanced >= 0.3 => 2,
            $advanced >= 0.15 => 1,
            default => 0,
        };

        // Scale: base + bonus, capped at 10
        return min(10.0, max(1.0, (float) ($base + $bonus)));
    }

    /** @return array<string, string> word → level */
    private function getLookup(): array
    {
        if ($this->lookup === null) {
            $this->lookup = CefrVocabulary::levelMap();
        }

        return $this->lookup;
    }

    /** @return list<string> */
    private function tokenize(string $text): array
    {
        $text = strtolower($text);
        preg_match_all('/\b[a-z]+(?:[\'-][a-z]+)*\b/', $text, $matches);

        return $matches[0] ?? [];
    }

    /** @return list<string> */
    private function tokenizeContent(string $text): array
    {
        $words = $this->tokenize($text);
        $functionWords = $this->functionWords();

        return array_values(array_filter($words, fn ($w) => ! isset($functionWords[$w])));
    }

    /** @return array<string, true> */
    private function functionWords(): array
    {
        static $fw = null;
        if ($fw === null) {
            // Common English function words — stop words for vocabulary assessment
            $list = [
                'a', 'an', 'the',
                'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
                'have', 'has', 'had', 'having',
                'do', 'does', 'did', 'doing',
                'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
                'i', 'you', 'he', 'she', 'it', 'we', 'they',
                'me', 'him', 'her', 'us', 'them',
                'my', 'your', 'his', 'its', 'our', 'their',
                'this', 'that', 'these', 'those',
                'here', 'there',
                'in', 'on', 'at', 'to', 'for', 'of', 'from', 'with', 'by', 'about',
                'as', 'than', 'like',
                'and', 'but', 'or', 'so', 'if', 'because', 'when', 'while', 'although',
                'not', 'no', 'nor',
                'all', 'some', 'any', 'many', 'much', 'more', 'most',
                'very', 'just', 'also', 'only', 'even', 'still', 'too', 'quite',
                'up', 'down', 'out', 'off', 'over', 'under', 'into', 'onto',
                'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
                'one', 'two', 'first', 'second', 'other', 'another', 'such',
                'well', 'back', 'way', 'thing', 'things', 'people', 'time', 'day', 'year',
                'yes', 'no', 'really', 'perhaps', 'maybe',
                'got', 'get', 'make', 'made', 'take', 'took', 'come', 'came', 'go', 'went',
                'say', 'said', 'tell', 'told', 'see', 'know', 'think', 'need', 'want',
                'use', 'used', 'give', 'find', 'ask', 'try', 'let', 'put',
            ];
            $fw = array_fill_keys($list, true);
        }

        return $fw;
    }
}
