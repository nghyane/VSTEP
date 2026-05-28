<?php

declare(strict_types=1);

namespace App\DTOs\Grading\Params;

use InvalidArgumentException;

final readonly class TaskFulfillmentParams
{
    private const REQUIRED = [
        'coverage_multiplier', 'task1_multiplier', 'position_bonus', 'irrelevant_penalty',
        'default_points_required', 'word_minimum_task1', 'word_minimum_task2',
        'depth_minimum', 'short_essay_caps',
    ];

    /** @param list<array{max_words: int, cap: float}> $shortEssayCaps */
    public function __construct(
        public float $coverageMultiplier,
        public float $task1Multiplier,
        public int $positionBonus,
        public int $irrelevantPenalty,
        public int $defaultPointsRequired,
        public int $wordMinimumTask1,
        public int $wordMinimumTask2,
        public float $depthMinimum,
        public array $shortEssayCaps,
    ) {}

    /** @param array<string,mixed> $data */
    public static function fromArray(array $data): self
    {
        self::validate($data);

        return new self(
            coverageMultiplier: (float) $data['coverage_multiplier'],
            task1Multiplier: (float) ($data['task1_multiplier'] ?? 6),
            positionBonus: (int) $data['position_bonus'],
            irrelevantPenalty: (int) $data['irrelevant_penalty'],
            defaultPointsRequired: (int) $data['default_points_required'],
            wordMinimumTask1: (int) $data['word_minimum_task1'],
            wordMinimumTask2: (int) $data['word_minimum_task2'],
            depthMinimum: (float) ($data['depth_minimum'] ?? 0.25),
            shortEssayCaps: (array) ($data['short_essay_caps'] ?? []),
        );
    }

    private static function validate(array $data): void
    {
        $missing = array_diff(self::REQUIRED, array_keys($data));
        if ($missing !== []) {
            throw new InvalidArgumentException(
                'TaskFulfillmentParams missing keys: '.implode(', ', $missing),
            );
        }
    }
}
