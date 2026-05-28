<?php

declare(strict_types=1);

namespace App\DTOs\Grading\Params;

use InvalidArgumentException;

final readonly class TaskFulfillmentParams
{
    private const REQUIRED = [
        'coverage_multiplier', 'position_bonus', 'irrelevant_penalty',
        'default_points_required', 'word_minimum_task1', 'word_minimum_task2',
    ];

    public function __construct(
        public float $coverageMultiplier,
        public int $positionBonus,
        public int $irrelevantPenalty,
        public int $defaultPointsRequired,
        public int $wordMinimumTask1,
        public int $wordMinimumTask2,
    ) {}

    /** @param array<string,mixed> $data */
    public static function fromArray(array $data): self
    {
        self::validate($data);

        return new self(
            coverageMultiplier: (float) $data['coverage_multiplier'],
            positionBonus: (int) $data['position_bonus'],
            irrelevantPenalty: (int) $data['irrelevant_penalty'],
            defaultPointsRequired: (int) $data['default_points_required'],
            wordMinimumTask1: (int) $data['word_minimum_task1'],
            wordMinimumTask2: (int) $data['word_minimum_task2'],
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
