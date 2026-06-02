<?php

declare(strict_types=1);

namespace App\Services\Linguistics;

use RuntimeException;

final class JsonlFixtureReader
{
    /** @return list<array<string, mixed>> */
    public function read(string $relativePath): array
    {
        $path = database_path($relativePath);
        if (! is_file($path)) {
            throw new RuntimeException("Missing JSONL fixture: {$path}");
        }

        $rows = [];
        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $lineNumber => $line) {
            $decoded = json_decode($line, true);
            if (! is_array($decoded)) {
                throw new RuntimeException('Invalid JSONL at '.$relativePath.' line '.($lineNumber + 1));
            }

            $rows[] = $decoded;
        }

        return $rows;
    }
}
