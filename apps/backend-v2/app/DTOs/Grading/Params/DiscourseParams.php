<?php

declare(strict_types=1);

namespace App\DTOs\Grading\Params;

use InvalidArgumentException;

final readonly class DiscourseParams
{
    private const REQUIRED = ['base', 'linking_factor', 'linking_cap', 'variety_thresholds'];

    /** @param list<array{threshold: float, bonus: int}> $varietyThresholds */
    public function __construct(
        public int $base,
        public float $linkingFactor,
        public float $linkingCap,
        public array $varietyThresholds,
    ) {}

    /** @param array<string,mixed> $data */
    public static function fromArray(array $data): self
    {
        self::validate($data);

        return new self(
            base: (int) $data['base'],
            linkingFactor: (float) $data['linking_factor'],
            linkingCap: (float) $data['linking_cap'],
            varietyThresholds: (array) $data['variety_thresholds'],
        );
    }

    private static function validate(array $data): void
    {
        $missing = array_diff(self::REQUIRED, array_keys($data));
        if ($missing !== []) {
            throw new InvalidArgumentException(
                'DiscourseParams missing keys: '.implode(', ', $missing),
            );
        }
    }
}
