<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Rule-based scoring — deterministic caps + penalties.
 *
 * Dùng output từ LanguageTool (error count/types) + text metrics
 * để tạo score caps. LLM không được vượt caps này.
 *
 * Triết lý: LLM giỏi đánh giá tổng thể nhưng hay "generous".
 * Rules đảm bảo: nhiều lỗi grammar → grammar score PHẢI thấp.
 */
class RuleBasedScoringService
{
    /**
     * @param  array<int,array<string,mixed>>  $languageToolErrors
     * @return array{caps: array<string,float|null>, metrics: array<string,mixed>, flags: string[]}
     */
    public function analyze(string $text, array $languageToolErrors): array
    {
        $metrics = $this->computeMetrics($text, $languageToolErrors);
        $caps = $this->computeCaps($metrics);
        $flags = $this->computeFlags($metrics, $caps);

        return ['caps' => $caps, 'metrics' => $metrics, 'flags' => $flags];
    }

    /**
     * Reconcile LLM scores with rule-based caps.
     * final = min(llm_score, cap) for each criterion.
     *
     * @param  array<string,float>  $llmScores
     * @param  array<string,float|null>  $caps  null = no cap
     * @return array<string,float>
     */
    public function reconcile(array $llmScores, array $caps): array
    {
        $final = [];
        foreach ($llmScores as $criterion => $score) {
            $cap = $caps[$criterion] ?? null;
            $final[$criterion] = $cap !== null ? min($score, $cap) : $score;
        }

        return $final;
    }

    /**
     * @return array<string,mixed>
     */
    private function computeMetrics(string $text, array $errors): array
    {
        $words = preg_split('/\s+/', trim($text));
        $wordCount = count($words);
        $sentences = preg_split('/[.!?]+/', trim($text), -1, PREG_SPLIT_NO_EMPTY);
        $sentenceCount = max(1, count($sentences));
        $paragraphs = preg_split('/\n\s*\n/', trim($text), -1, PREG_SPLIT_NO_EMPTY);
        $paragraphCount = count($paragraphs);

        $uniqueWords = count(array_unique(array_map('strtolower', $words)));
        $uniqueRatio = $wordCount > 0 ? $uniqueWords / $wordCount : 0;

        $avgSentenceLength = $wordCount / $sentenceCount;

        $grammarErrors = array_filter($errors, fn ($e) => str_contains(strtolower($e['category'] ?? ''), 'grammar'));
        $grammarErrorCount = count($grammarErrors);
        $totalErrorCount = count($errors);
        $errorsPerSentence = $totalErrorCount / $sentenceCount;

        // Linking words detection
        $linkingWords = ['however', 'moreover', 'furthermore', 'therefore', 'consequently',
            'nevertheless', 'although', 'despite', 'in addition', 'on the other hand',
            'firstly', 'secondly', 'finally', 'in conclusion', 'for example',
            'as a result', 'in contrast', 'meanwhile', 'similarly'];
        $textLower = strtolower($text);
        $linkingCount = 0;
        foreach ($linkingWords as $lw) {
            $linkingCount += substr_count($textLower, $lw);
        }

        return [
            'word_count' => $wordCount,
            'sentence_count' => $sentenceCount,
            'paragraph_count' => $paragraphCount,
            'unique_ratio' => round($uniqueRatio, 3),
            'avg_sentence_length' => round($avgSentenceLength, 1),
            'grammar_error_count' => $grammarErrorCount,
            'total_error_count' => $totalErrorCount,
            'errors_per_sentence' => round($errorsPerSentence, 2),
            'linking_word_count' => $linkingCount,
        ];
    }

    /**
     * @param  array<string,mixed>  $metrics
     * @return array<string,float|null> null = no cap
     */
    private function computeCaps(array $metrics): array
    {
        $caps = [
            'task_achievement' => null,
            'coherence' => null,
            'lexical' => null,
            'grammar' => null,
        ];

        // Grammar cap based on error rate per sentence.
        $eps = $metrics['errors_per_sentence'];
        if ($eps > 1.0) {
            $caps['grammar'] = 1.5;
        } elseif ($eps > 0.5) {
            $caps['grammar'] = 2.5;
        } elseif ($eps > 0.2) {
            $caps['grammar'] = 3.0;
        }

        // Word count penalty → task achievement cap.
        // VSTEP Part 1: min 100, Part 2: min 200.
        if ($metrics['word_count'] < 80) {
            $caps['task_achievement'] = 2.0;
        } elseif ($metrics['word_count'] < 100) {
            $caps['task_achievement'] = 2.5;
        }

        // Vocabulary diversity.
        if ($metrics['unique_ratio'] < 0.4) {
            $caps['lexical'] = 2.0;
        } elseif ($metrics['unique_ratio'] < 0.5) {
            $caps['lexical'] = 2.5;
        }

        // Sentence variety — all very short = limited range.
        if ($metrics['avg_sentence_length'] < 6) {
            $caps['grammar'] = min($caps['grammar'] ?? 4.0, 2.0);
        }

        // Paragraph structure.
        if ($metrics['paragraph_count'] < 2) {
            $caps['coherence'] = 2.0;
        }

        // No linking words at all.
        if ($metrics['linking_word_count'] === 0 && $metrics['sentence_count'] > 3) {
            $caps['coherence'] = min($caps['coherence'] ?? 4.0, 2.5);
        }

        return $caps;
    }

    /**
     * @return string[]
     */
    private function computeFlags(array $metrics, array $caps): array
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
}
