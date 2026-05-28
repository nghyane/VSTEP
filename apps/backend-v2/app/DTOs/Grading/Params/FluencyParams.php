<?php

declare(strict_types=1);

namespace App\DTOs\Grading\Params;

use InvalidArgumentException;

final readonly class FluencyParams
{
    private const REQUIRED = ['base', 'cap', 'wpm_thresholds'];

    /** @param list<array{threshold: float, bonus: int}> $wpmThresholds */
    public function __construct(
        public int $base,
        public float $cap,
        public array $wpmThresholds,
    ) {}

    /** @param array<string,mixed> $data */
    public static function fromArray(array $data): self
    {
        self::validate($data);

        return new self(
            base: (int) $data['base'],
            cap: (float) $data['cap'],
            wpmThresholds: (array) $data['wpm_thresholds'],
        );
    }

    private static function validate(array $data): void
    {
        $missing = array_diff(self::REQUIRED, array_keys($data));
        if ($missing !== []) {
            throw new InvalidArgumentException(
                'FluencyParams missing keys: '.implode(', ', $missing),
            );
        }
    }
}
