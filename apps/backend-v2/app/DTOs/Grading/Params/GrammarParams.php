<?php

declare(strict_types=1);

namespace App\DTOs\Grading\Params;

use InvalidArgumentException;

final readonly class GrammarParams
{
    private const REQUIRED = ['band_thresholds', 'accuracy_factor', 'max_accuracy'];

    /** @param array<int, int> $bandThresholds */
    /** @param array<string, float> $maxAccuracy */
    public function __construct(
        public array $bandThresholds,
        public float $accuracyFactor,
        public array $maxAccuracy,
    ) {}

    /** @param array<string,mixed> $data */
    public static function fromArray(array $data): self
    {
        self::validate($data);

        return new self(
            bandThresholds: (array) $data['band_thresholds'],
            accuracyFactor: (float) $data['accuracy_factor'],
            maxAccuracy: (array) $data['max_accuracy'],
        );
    }

    private static function validate(array $data): void
    {
        $missing = array_diff(self::REQUIRED, array_keys($data));
        if ($missing !== []) {
            throw new InvalidArgumentException(
                'GrammarParams missing keys: '.implode(', ', $missing),
            );
        }
    }
}
