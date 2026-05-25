<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ScoringPolicy;
use Illuminate\Support\Str;

/**
 * Rule-based scoring — deterministic caps + penalties.
 *
 * Evaluates structured cap rules from ScoringPolicy entity.
 * LLM scores are capped by these rules to prevent inflation.
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
     * @return array{caps: array<string,float|null>, metrics: array<string,mixed>, flags: string[]}
     */
    public function analyze(string $text, array $languageToolErrors, ScoringPolicy $policy): array
    {
        $metrics = $this->computeMetrics($text, $languageToolErrors);
        $caps = $this->computeCaps($metrics, $policy);
        $flags = $this->computeFlags($metrics);

        return ['caps' => $caps, 'metrics' => $metrics, 'flags' => $flags];
    }

    /**
     * Reconcile LLM scores with rule-based caps.
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
     * Evaluate caps from ScoringPolicy structured rules.
     *
     * @return array<string,float|null>
     */
    private function computeCaps(array $metrics, ScoringPolicy $policy): array
    {
        $caps = [];
        $rules = $policy->rules['caps'] ?? [];

        foreach ($rules as $criterion => $criterionRules) {
            $cap = null;
            foreach ($criterionRules as $rule) {
                if ($this->evaluateRule($rule, $metrics)) {
                    $ruleMax = (float) $rule['max'];
                    $cap = $cap !== null ? min($cap, $ruleMax) : $ruleMax;
                }
            }
            $caps[$criterion] = $cap;
        }

        return $caps;
    }

    /**
     * Evaluate a single structured rule against metrics.
     *
     * Rule format (single): ['metric' => 'x', 'op' => '>', 'value' => 1.0, 'max' => 2.5]
     * Rule format (compound): ['all' => [...conditions], 'max' => 2.5]
     */
    private function evaluateRule(array $rule, array $metrics): bool
    {
        if (isset($rule['all'])) {
            foreach ($rule['all'] as $sub) {
                if (! $this->evaluateComparison($sub, $metrics)) {
                    return false;
                }
            }

            return true;
        }

        return $this->evaluateComparison($rule, $metrics);
    }

    private function evaluateComparison(array $rule, array $metrics): bool
    {
        $metricValue = $metrics[$rule['metric']] ?? 0;
        $op = $rule['op'];
        $threshold = (float) $rule['value'];

        return match ($op) {
            '>' => $metricValue > $threshold,
            '<' => $metricValue < $threshold,
            '>=' => $metricValue >= $threshold,
            '<=' => $metricValue <= $threshold,
            '==' => $metricValue == $threshold,
            '!=' => $metricValue != $threshold,
            default => false,
        };
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
}
