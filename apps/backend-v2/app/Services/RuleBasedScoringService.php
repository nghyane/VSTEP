<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Rule-based scoring — deterministic metrics for LLM context.
 *
 * Computes word count, sentence count, error rate, linking word count, etc.
 * No caps applied. LLM evaluates independently against VSTEP rubric descriptors.
 */
final class RuleBasedScoringService
{
    private const LINKING_WORDS = [
        'however', 'moreover', 'furthermore', 'therefore', 'consequently',
        'nevertheless', 'although', 'despite', 'in addition', 'on the other hand',
        'firstly', 'secondly', 'finally', 'in conclusion', 'for example',
        'as a result', 'in contrast', 'meanwhile', 'similarly',
    ];

    /**
     * @param  array<int,array<string,mixed>>  $languageToolErrors
     * @return array{metrics: array<string,mixed>, flags: string[]}
     */
    public function analyze(string $text, array $languageToolErrors): array
    {
        $metrics = $this->computeMetrics($text, $languageToolErrors);
        $flags = $this->computeFlags($metrics);

        return ['metrics' => $metrics, 'flags' => $flags];
    }

    /** @return array<string,mixed> */
    private function computeMetrics(string $text, array $errors): array
    {
        $words = Str::of($text)->trim()->split('/\s+/');
        $wordCount = $words->count();
        $sentences = Str::of($text)->trim()->split('/[.!?]+/', -1, PREG_SPLIT_NO_EMPTY);
        $sentenceCount = max(1, $sentences->count());
        $paragraphs = Str::of($text)->trim()->split('/\n\s*\n/', -1, PREG_SPLIT_NO_EMPTY);
        $paragraphCount = $paragraphs->count();

        $uniqueWords = $words->map(fn (string $w): string => Str::lower($w))->unique()->count();
        $uniqueRatio = $wordCount > 0 ? $uniqueWords / $wordCount : 0;

        $avgSentenceLength = $wordCount / $sentenceCount;

        $grammarErrors = array_filter($errors, fn ($e) => Str::contains(Str::lower($e['category'] ?? ''), 'grammar'));
        $grammarErrorCount = count($grammarErrors);
        $totalErrorCount = count($errors);
        $errorsPerSentence = $totalErrorCount / $sentenceCount;

        $textLower = Str::lower($text);
        $linkingCount = 0;
        foreach (self::LINKING_WORDS as $lw) {
            $linkingCount += substr_count($textLower, $lw);
        }

        $totalChars = $words->map(fn (string $w): int => mb_strlen($w))->sum();
        $avgWordLength = $wordCount > 0 ? round($totalChars / $wordCount, 1) : 0;

        $sentenceLengths = $sentences->map(fn (string $s): int => str_word_count(trim($s)));
        $sentenceVariety = $this->stdDev($sentenceLengths, $avgSentenceLength);

        // Flesch-Kincaid readability grade: higher = more complex
        $readability = $wordCount > 0 && $sentenceCount > 0
            ? round(4.71 * ($totalChars / $wordCount) + 0.5 * ($wordCount / $sentenceCount) - 21.43, 1)
            : 0;

        // Complex vocabulary count (academic/formal words)
        $complexVocabCount = $this->countComplexVocab($textLower);

        return [
            'word_count' => $wordCount,
            'sentence_count' => $sentenceCount,
            'paragraph_count' => $paragraphCount,
            'unique_ratio' => round($uniqueRatio, 3),
            'avg_sentence_length' => round($avgSentenceLength, 1),
            'sentence_variety' => round($sentenceVariety, 2),
            'avg_word_length' => $avgWordLength,
            'readability_grade' => $readability,
            'complex_vocab_count' => $complexVocabCount,
            'grammar_error_count' => $grammarErrorCount,
            'total_error_count' => $totalErrorCount,
            'errors_per_sentence' => round($errorsPerSentence, 2),
            'linking_word_count' => $linkingCount,
        ];
    }

    /** @return string[] */
    private function computeFlags(array $metrics): array
    {
        $flags = [];

        if ($metrics['word_count'] < 80) {
            $flags[] = 'severely_under_word_count';
        }
        if ($metrics['errors_per_sentence'] > 1.0) {
            $flags[] = 'high_error_rate';
        }
        if ($metrics['paragraph_count'] < 2) {
            $flags[] = 'no_paragraph_structure';
        }

        return $flags;
    }

    /**
     * Population standard deviation.
     *
     * @param  Collection<int, int|float>  $values
     */
    private function stdDev($values, float $mean): float
    {
        $count = $values->count();
        if ($count <= 1) {
            return 0.0;
        }

        $sumSquaredDiff = $values->reduce(fn (float $carry, $v) => $carry + (($v - $mean) ** 2), 0.0);

        return sqrt($sumSquaredDiff / $count);
    }

    /**
     * Count academic/formal vocabulary words in text.
     * Based on VSTEP B1-C1 vocabulary expectations.
     */
    private function countComplexVocab(string $text): int
    {
        $words = [
            'therefore', 'however', 'moreover', 'furthermore', 'nevertheless', 'consequently',
            'significant', 'demonstrate', 'sufficient', 'approximately', 'subsequently',
            'particularly', 'fundamentally', 'essentially', 'inevitably', 'predominantly',
            'acquisition', 'implementation', 'interpretation', 'investigation', 'participation',
            'beneficial', 'challenging', 'comprehensive', 'considerable', 'detrimental',
            'advantageous', 'disadvantageous', 'substantial', 'conventional', 'alternative',
            'phenomenon', 'perspective', 'consequence', 'inequality', 'sustainability',
            'globalization', 'urbanization', 'industrialization', 'technological',
            'deterioration', 'enhancement', 'diversity', 'accessibility', 'affordability',
        ];

        $count = 0;
        foreach ($words as $word) {
            if (str_contains($text, $word)) {
                $count++;
            }
        }

        return $count;
    }
}
