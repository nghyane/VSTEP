<?php

declare(strict_types=1);

namespace App\DTOs\Grading\Params;

use InvalidArgumentException;

final readonly class PronunciationParams
{
    private const REQUIRED = ['type'];

    public function __construct(
        public string $type,
    ) {}

    /** @param array<string,mixed> $data */
    public static function fromArray(array $data): self
    {
        self::validate($data);

        return new self(
            type: (string) $data['type'],
        );
    }

    private static function validate(array $data): void
    {
        $missing = array_diff(self::REQUIRED, array_keys($data));
        if ($missing !== []) {
            throw new InvalidArgumentException(
                'PronunciationParams missing keys: '.implode(', ', $missing),
            );
        }
    }
}
