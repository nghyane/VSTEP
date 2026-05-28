<?php

declare(strict_types=1);

namespace App\DTOs\Grading\Params;

use InvalidArgumentException;

final readonly class OrganizationParams
{
    private const REQUIRED = [
        'base', 'para_bonus', 'linking_factor', 'linking_density_factor',
        'linking_cap', 'variety_thresholds', 'compact_threshold', 'compact_penalty',
    ];

    /** @param array<int, int> $paraBonus */
    /** @param list<array{threshold: float, bonus: int}> $varietyThresholds */
    public function __construct(
        public int $base,
        public array $paraBonus,
        public float $linkingFactor,
        public float $linkingDensityFactor,
        public float $linkingCap,
        public array $varietyThresholds,
        public int $compactThreshold,
        public float $compactPenalty,
    ) {}

    /** @param array<string,mixed> $data */
    public static function fromArray(array $data): self
    {
        self::validate($data);

        return new self(
            base: (int) $data['base'],
            paraBonus: (array) $data['para_bonus'],
            linkingFactor: (float) $data['linking_factor'],
            linkingDensityFactor: (float) $data['linking_density_factor'],
            linkingCap: (float) $data['linking_cap'],
            varietyThresholds: (array) $data['variety_thresholds'],
            compactThreshold: (int) $data['compact_threshold'],
            compactPenalty: (float) $data['compact_penalty'],
        );
    }

    private static function validate(array $data): void
    {
        $missing = array_diff(self::REQUIRED, array_keys($data));
        if ($missing !== []) {
            throw new InvalidArgumentException(
                'OrganizationParams missing keys: '.implode(', ', $missing),
            );
        }
    }
}
