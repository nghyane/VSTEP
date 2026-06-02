<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\LexicalSignal;
use App\Services\Linguistics\JsonlFixtureReader;
use App\Services\Linguistics\LinguisticCacheKeys;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Rule-based scoring — deterministic metrics for LLM context.
 *
 * Computes word count, sentence count, error rate, linking word count, etc.
 * No caps applied. LLM evaluates independently against VSTEP rubric descriptors.
 */
final class RuleBasedScoringService
{
    private const LEXICAL_SIGNAL_FIXTURE = 'reference/linguistics/bootstrap/lexical-signals.jsonl';

    /** Salutation patterns for letter/email (VSTEP Part 1). */
    private const SALUTATION_PATTERNS = [
        '/^(dear|hi|hello|to|dearest|greetings)\b/mi',
    ];

    /** Closing patterns for letter/email (VSTEP Part 1). */
    private const CLOSING_PATTERNS = [
        '/(?:sincerely|yours truly|yours faithfully|best regards|kind regards|regards|yours|warmly|cheers|take care|best|love|thanks)[,\s]*$/mi',
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
        $trimmedText = trim($text);
        $words = $trimmedText === ''
            ? collect()
            : Str::of($trimmedText)->split('/\s+/');
        $wordCount = $words->count();
        $sentences = Str::of($trimmedText)->split('/[.!?]+/', -1, PREG_SPLIT_NO_EMPTY);
        $sentenceCount = $sentences->count();
        $effectiveSentenceCount = max(1, $sentenceCount);
        $paragraphs = Str::of($trimmedText)->split('/\n\s*\n/', -1, PREG_SPLIT_NO_EMPTY);
        $paragraphCount = $paragraphs->count();

        $uniqueWords = $words->map(fn (string $w): string => Str::lower($w))->unique()->count();
        $uniqueRatio = $wordCount > 0 ? $uniqueWords / $wordCount : 0;

        $avgSentenceLength = $wordCount / $effectiveSentenceCount;

        $grammarErrors = array_filter($errors, fn ($e) => Str::contains(Str::lower($e['category'] ?? ''), 'grammar'));
        $grammarErrorCount = count($grammarErrors);
        $spellingErrors = array_filter($errors, fn ($e) => Str::contains(Str::lower($e['category'] ?? ''), 'typo')
            || Str::contains(Str::lower($e['category'] ?? ''), 'spelling'));
        $spellingErrorCount = count($spellingErrors);
        $punctuationErrors = array_filter($errors, fn ($e) => Str::contains(Str::lower($e['category'] ?? ''), 'punctuation'));
        $punctuationErrorCount = count($punctuationErrors);
        $totalErrorCount = count($errors);
        $errorsPerSentence = $totalErrorCount / $effectiveSentenceCount;

        $textLower = Str::lower($text);
        $linkingMatches = $this->lexicalSignalMatches($textLower, 'linking');
        $linkingCount = $this->sumSignalMatches($linkingMatches);

        $totalChars = $words->map(fn (string $w): int => mb_strlen($w))->sum();
        $avgWordLength = $wordCount > 0 ? round($totalChars / $wordCount, 1) : 0;

        $sentenceLengths = $sentences->map(fn (string $s): int => str_word_count(trim($s)));
        $sentenceVariety = $this->stdDev($sentenceLengths, $avgSentenceLength);

        // Flesch-Kincaid readability grade: higher = more complex
        $readability = $wordCount > 0 && $sentenceCount > 0
            ? round(4.71 * ($totalChars / $wordCount) + 0.5 * ($wordCount / $sentenceCount) - 21.43, 1)
            : 0;

        // Complex vocabulary count (academic/formal words and assessed collocations)
        $collocationMatches = $this->lexicalSignalMatches($textLower, 'collocation');
        $complexVocabCount = $this->sumSignalMatches($collocationMatches);

        // Letter format detection (VSTEP Part 1)
        $hasSalutation = $this->hasSalutation($text);
        $hasClosing = $this->hasClosing($text);

        // Tone/register signals (formal vs informal)
        $toneSignals = $this->detectToneSignals($textLower);

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
            'spelling_error_count' => $spellingErrorCount,
            'punctuation_error_count' => $punctuationErrorCount,
            'has_salutation' => $hasSalutation,
            'has_closing' => $hasClosing,
            'tone_signals' => $toneSignals,
            'lexical_signal_matches' => [...$linkingMatches, ...$collocationMatches],
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

    /** @return list<array{phrase: string, type: string, category: string, level: string|null, count: int, weight: int, source: string}> */
    private function lexicalSignalMatches(string $text, string $type): array
    {
        $matches = [];
        foreach ($this->lexicalSignals($type) as $signal) {
            $count = $this->countPhraseOccurrences($text, $signal['phrase']);
            if ($count === 0) {
                continue;
            }

            $matches[] = [
                'phrase' => $signal['phrase'],
                'type' => $signal['type'],
                'category' => $signal['category'],
                'level' => $signal['level'],
                'count' => $count,
                'weight' => $signal['weight'],
                'source' => $signal['source'],
            ];
        }

        return $matches;
    }

    /** @param list<array{count: int, weight: int}> $matches */
    private function sumSignalMatches(array $matches): int
    {
        return array_reduce($matches, fn (int $sum, array $match): int => $sum + $match['count'] * $match['weight'], 0);
    }

    /** @return list<array{phrase: string, type: string, category: string, level: string|null, weight: int, source: string}> */
    private function lexicalSignals(string $type): array
    {
        static $cache = [];
        if (isset($cache[$type])) {
            return $cache[$type];
        }

        if (! Schema::hasTable('lexical_signals')) {
            return $cache[$type] = $this->fixtureLexicalSignals($type);
        }

        $signals = Cache::rememberForever(
            LinguisticCacheKeys::lexicalSignals('writing', $type),
            fn (): array => LexicalSignal::query()
                ->active()
                ->where('skill', 'writing')
                ->where('type', $type)
                ->get(['phrase', 'type', 'category', 'level', 'weight', 'source'])
                ->map(fn (LexicalSignal $signal): array => [
                    'phrase' => Str::lower($signal->phrase),
                    'type' => $signal->type,
                    'category' => $signal->category,
                    'level' => $signal->level,
                    'weight' => $signal->weight,
                    'source' => $signal->source,
                ])
                ->values()
                ->all(),
        );

        return $cache[$type] = $signals !== [] ? $signals : $this->fixtureLexicalSignals($type);
    }

    /** @return list<array{phrase: string, type: string, category: string, level: string|null, weight: int, source: string}> */
    private function fixtureLexicalSignals(string $type): array
    {
        $signals = [];
        foreach (app(JsonlFixtureReader::class)->read(self::LEXICAL_SIGNAL_FIXTURE) as $decoded) {
            if (($decoded['type'] ?? null) !== $type || ($decoded['skill'] ?? 'writing') !== 'writing') {
                continue;
            }

            $signals[] = [
                'phrase' => Str::lower((string) $decoded['phrase']),
                'type' => (string) $decoded['type'],
                'category' => (string) $decoded['category'],
                'level' => isset($decoded['level']) ? (string) $decoded['level'] : null,
                'weight' => (int) ($decoded['weight'] ?? 1),
                'source' => (string) $decoded['source'],
            ];
        }

        return $signals;
    }

    private function countPhraseOccurrences(string $text, string $phrase): int
    {
        $pattern = '/(?<![a-z])'.preg_quote($phrase, '/').'(?![a-z])/u';

        return preg_match_all($pattern, $text) ?: 0;
    }

    /**
     * Detect letter/email salutation (VSTEP Part 1).
     */
    private function hasSalutation(string $text): bool
    {
        foreach (self::SALUTATION_PATTERNS as $pattern) {
            if (preg_match($pattern, $text)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Detect letter/email closing phrase (VSTEP Part 1).
     */
    private function hasClosing(string $text): bool
    {
        foreach (self::CLOSING_PATTERNS as $pattern) {
            if (preg_match($pattern, $text)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Detect tone/register signals in text.
     *
     * @return array{formal_count: int, informal_count: int, informal_words: list<string>}
     */
    private function detectToneSignals(string $text): array
    {
        $informalWords = [
            'gonna', 'wanna', 'gotta', 'kinda', 'sorta', 'dunno', 'lemme', 'gimme',
            'cool', 'awesome', 'stuff', 'guys', 'dude', 'yeah', 'nah', 'okay', 'ok',
            'lots', 'a lot of', 'big deal', 'super', 'really really', 'so so',
            'btw', 'lol', 'omg', 'idk', 'imo', 'tbh', 'thx', 'pls', 'u', 'ur',
            'cuz', 'cause', 'til', 'tho', 'thru',
        ];

        $formalWords = [
            'furthermore', 'moreover', 'consequently', 'nevertheless', 'accordingly',
            'therefore', 'thus', 'hence', 'whereas', 'notwithstanding', 'hereby',
            'pursuant', 'regarding', 'concerning', 'in accordance', 'in regard to',
        ];

        $informalCount = 0;
        $foundInformal = [];
        foreach ($informalWords as $word) {
            if (str_contains($text, $word)) {
                $informalCount++;
                $foundInformal[] = $word;
            }
        }

        $formalCount = 0;
        foreach ($formalWords as $word) {
            if (str_contains($text, $word)) {
                $formalCount++;
            }
        }

        return [
            'formal_count' => $formalCount,
            'informal_count' => $informalCount,
            'informal_words' => $foundInformal,
        ];
    }
}
