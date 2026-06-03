<?php

declare(strict_types=1);

namespace App\DTOs\Grading\Params;

use InvalidArgumentException;

final readonly class VocabularyParams
{
    private const REQUIRED = [
        'base', 'cap', 'unique_thresholds', 'length_thresholds',
        'readability_thresholds', 'complex_thresholds',
    ];

    /** @param list<array{threshold: float, bonus: float}> $uniqueThresholds, $lengthThresholds, $readabilityThresholds, $complexThresholds, $cefrThresholds, $advancedThresholds */
    public function __construct(
        public int $base,
        public float $cap,
        public array $uniqueThresholds,
        public array $lengthThresholds,
        public array $readabilityThresholds,
        public array $complexThresholds,
        public array $cefrThresholds,
        public array $advancedThresholds,
        public array $model,
    ) {}

    /** @param array<string,mixed> $data */
    public static function fromArray(array $data): self
    {
        self::validate($data);

        return new self(
            base: (int) $data['base'],
            cap: (float) $data['cap'],
            uniqueThresholds: (array) $data['unique_thresholds'],
            lengthThresholds: (array) $data['length_thresholds'],
            readabilityThresholds: (array) $data['readability_thresholds'],
            complexThresholds: (array) $data['complex_thresholds'],
            cefrThresholds: (array) ($data['cefr_thresholds'] ?? []),
            advancedThresholds: (array) ($data['advanced_thresholds'] ?? []),
            model: (array) ($data['model'] ?? []),
        );
    }

    private static function validate(array $data): void
    {
        $missing = array_diff(self::REQUIRED, array_keys($data));
        if ($missing !== []) {
            throw new InvalidArgumentException(
                'VocabularyParams missing keys: '.implode(', ', $missing),
            );
        }
    }
}
