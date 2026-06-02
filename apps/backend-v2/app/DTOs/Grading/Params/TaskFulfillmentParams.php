<?php

declare(strict_types=1);

namespace App\DTOs\Grading\Params;

use InvalidArgumentException;

final readonly class TaskFulfillmentParams
{
    private const REQUIRED = [
        'coverage_multiplier', 'task1_multiplier', 'position_bonus', 'irrelevant_penalty',
        'default_points_required', 'word_minimum_task1', 'word_minimum_task2',
        'depth_minimum', 'non_assessable_word_limit',
        'task_fulfillment_word_caps', 'tf_cap_ratio', 'severe_minimum_words_task1',
        'severe_minimum_words_task2', 'minimum_covered_points',
    ];

    /**
     * @param  list<array{max_words: int, cap: float}>  $shortResponseCaps
     * @param  list<array{max_words: int, cap: float}>  $taskFulfillmentWordCaps
     */
    public function __construct(
        public float $coverageMultiplier,
        public float $task1Multiplier,
        public float $positionBonus,
        public int $irrelevantPenalty,
        public int $defaultPointsRequired,
        public int $wordMinimumTask1,
        public int $wordMinimumTask2,
        public float $depthMinimum,
        public int $nonAssessableWordLimit,
        public array $shortResponseCaps,
        public array $taskFulfillmentWordCaps,
        public float $tfCapRatio,
        public int $severeMinimumWordsTask1,
        public int $severeMinimumWordsTask2,
        public int $minimumCoveredPoints,
    ) {}

    /** @param array<string,mixed> $data */
    public static function fromArray(array $data): self
    {
        self::validate($data);
        $shortResponseCaps = $data['short_response_caps'] ?? $data['short_essay_caps'];

        return new self(
            coverageMultiplier: (float) $data['coverage_multiplier'],
            task1Multiplier: (float) $data['task1_multiplier'],
            positionBonus: (float) $data['position_bonus'],
            irrelevantPenalty: (int) $data['irrelevant_penalty'],
            defaultPointsRequired: (int) $data['default_points_required'],
            wordMinimumTask1: (int) $data['word_minimum_task1'],
            wordMinimumTask2: (int) $data['word_minimum_task2'],
            depthMinimum: (float) $data['depth_minimum'],
            nonAssessableWordLimit: (int) $data['non_assessable_word_limit'],
            shortResponseCaps: (array) $shortResponseCaps,
            taskFulfillmentWordCaps: (array) $data['task_fulfillment_word_caps'],
            tfCapRatio: (float) $data['tf_cap_ratio'],
            severeMinimumWordsTask1: (int) $data['severe_minimum_words_task1'],
            severeMinimumWordsTask2: (int) $data['severe_minimum_words_task2'],
            minimumCoveredPoints: (int) $data['minimum_covered_points'],
        );
    }

    public function severeMinimumWords(int $part): int
    {
        return $part === 1 ? $this->severeMinimumWordsTask1 : $this->severeMinimumWordsTask2;
    }

    public function isNonAssessable(int $wordCount): bool
    {
        return $wordCount < $this->nonAssessableWordLimit;
    }

    public function shortResponseScoreCap(int $wordCount): ?float
    {
        return $this->resolveCap($wordCount, $this->shortResponseCaps);
    }

    public function taskFulfillmentScoreCap(int $wordCount): ?float
    {
        return $this->resolveCap($wordCount, $this->taskFulfillmentWordCaps);
    }

    private static function validate(array $data): void
    {
        $missing = array_diff(self::REQUIRED, array_keys($data));
        if ($missing !== []) {
            throw new InvalidArgumentException(
                'TaskFulfillmentParams missing keys: '.implode(', ', $missing),
            );
        }

        if ((int) $data['non_assessable_word_limit'] <= 0) {
            throw new InvalidArgumentException('TaskFulfillmentParams non_assessable_word_limit must be positive.');
        }

        if ((int) $data['severe_minimum_words_task1'] <= 0 || (int) $data['severe_minimum_words_task2'] <= 0) {
            throw new InvalidArgumentException('TaskFulfillmentParams severe minimum words must be positive.');
        }

        if ((int) $data['minimum_covered_points'] <= 0) {
            throw new InvalidArgumentException('TaskFulfillmentParams minimum_covered_points must be positive.');
        }

        if (! array_key_exists('short_response_caps', $data) && ! array_key_exists('short_essay_caps', $data)) {
            throw new InvalidArgumentException('TaskFulfillmentParams missing keys: short_response_caps');
        }

        foreach (['short_response_caps', 'short_essay_caps', 'task_fulfillment_word_caps'] as $key) {
            if (! array_key_exists($key, $data)) {
                continue;
            }

            if (! is_array($data[$key])) {
                throw new InvalidArgumentException("TaskFulfillmentParams {$key} must be an array.");
            }

            self::validateCaps($data[$key], $key);
        }
    }

    /** @param array<int,array<string,mixed>> $caps */
    private static function validateCaps(array $caps, string $key): void
    {
        foreach ($caps as $index => $cap) {
            if (! is_array($cap)) {
                throw new InvalidArgumentException("TaskFulfillmentParams {$key}.{$index} must be an array.");
            }

            foreach (['max_words', 'cap'] as $requiredKey) {
                if (! array_key_exists($requiredKey, $cap)) {
                    throw new InvalidArgumentException("TaskFulfillmentParams {$key}.{$index} missing key: {$requiredKey}");
                }
            }

            if ((int) $cap['max_words'] <= 0 || (float) $cap['cap'] < 1.0 || (float) $cap['cap'] > 10.0) {
                throw new InvalidArgumentException("TaskFulfillmentParams {$key}.{$index} has invalid cap bounds.");
            }
        }
    }

    /** @param list<array{max_words: int, cap: float}> $caps */
    private function resolveCap(int $wordCount, array $caps): ?float
    {
        if ($wordCount < 0) {
            return null;
        }

        usort($caps, fn (array $a, array $b): int => ((int) $a['max_words']) <=> ((int) $b['max_words']));

        foreach ($caps as $cap) {
            if ($wordCount <= (int) $cap['max_words']) {
                return (float) $cap['cap'];
            }
        }

        return null;
    }
}
