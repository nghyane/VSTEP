<?php

declare(strict_types=1);

namespace App\Services\Linguistics;

final class LinguisticFixtureValidator
{
    private const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

    public function __construct(
        private readonly JsonlFixtureReader $reader,
    ) {}

    /** @return list<string> */
    public function validateLexicalSignals(): array
    {
        $sources = $this->sources();
        $errors = [];
        $seen = [];

        foreach ($this->reader->read('reference/linguistics/bootstrap/lexical-signals.jsonl') as $index => $row) {
            $line = $index + 1;
            $errors = [...$errors, ...$this->required($row, ['phrase', 'type', 'category', 'skill', 'weight', 'source'], $line)];

            $this->validateSource($row, $sources, $line, $errors);
            $this->validateLevel($row, $line, $errors);
            $this->validateWeight($row, $line, $errors);

            if (isset($row['type']) && ! in_array($row['type'], [
                'linking',
                'collocation',
                'discourse_marker',
                'fluency_marker',
                'interaction_repair',
                'self_repair',
                'topic_development',
                'topic_lexis',
                'hesitation',
            ], true)) {
                $errors[] = "line {$line}: invalid lexical type";
            }

            $identity = implode('|', [
                (string) ($row['phrase'] ?? ''),
                (string) ($row['type'] ?? ''),
                (string) ($row['skill'] ?? ''),
                (string) ($row['task_type'] ?? ''),
            ]);
            if (isset($seen[$identity])) {
                $errors[] = "line {$line}: duplicate lexical signal identity";
            }
            $seen[$identity] = true;
        }

        return $errors;
    }

    /** @return list<string> */
    public function validateCefrVocabulary(): array
    {
        $sources = $this->sources();
        $errors = [];
        $seen = [];

        foreach ($this->reader->read('reference/linguistics/bootstrap/cefr-vocabulary.jsonl') as $index => $row) {
            $line = $index + 1;
            $errors = [...$errors, ...$this->required($row, ['word', 'level', 'pos', 'topic', 'source'], $line)];

            $this->validateSource($row, $sources, $line, $errors);
            $this->validateLevel($row, $line, $errors);

            $word = (string) ($row['word'] ?? '');
            if (isset($seen[$word])) {
                $errors[] = "line {$line}: duplicate CEFR vocabulary word";
            }
            $seen[$word] = true;
        }

        return $errors;
    }

    /** @return list<string> */
    public function validateGrammarPatterns(): array
    {
        $sources = $this->sources();
        $errors = [];
        $seen = [];

        foreach ($this->reader->read('reference/linguistics/bootstrap/grammar-patterns.jsonl') as $index => $row) {
            $line = $index + 1;
            $errors = [...$errors, ...$this->required($row, ['key', 'label', 'level', 'category', 'pattern_type', 'pattern', 'skill', 'weight', 'source'], $line)];

            $this->validateSource($row, $sources, $line, $errors);
            $this->validateLevel($row, $line, $errors);
            $this->validateWeight($row, $line, $errors);

            if (($row['pattern_type'] ?? null) !== 'regex') {
                $errors[] = "line {$line}: unsupported grammar pattern type";
            }

            if (isset($row['pattern']) && @preg_match((string) $row['pattern'], '') === false) {
                $errors[] = "line {$line}: invalid grammar regex";
            }

            $key = (string) ($row['key'] ?? '');
            if (isset($seen[$key])) {
                $errors[] = "line {$line}: duplicate grammar pattern key";
            }
            $seen[$key] = true;
        }

        return $errors;
    }

    /** @return list<string> */
    public function validateGoldenFixtures(): array
    {
        $sources = $this->sources();
        $errors = [];
        $paths = glob(database_path('reference/linguistics/golden/*.json')) ?: [];

        foreach ($paths as $path) {
            $name = basename($path);
            $row = json_decode((string) file_get_contents($path), true);

            if (! is_array($row)) {
                $errors[] = "{$name}: invalid JSON";

                continue;
            }

            foreach ($this->required($row, ['id', 'task_type', 'expected_band', 'expected_level', 'expected_source'], 1) as $error) {
                $errors[] = "{$name}: {$error}";
            }

            $source = (string) ($row['expected_source'] ?? '');
            if ($source !== '' && ! array_key_exists($source, $sources)) {
                $errors[] = "{$name}: unknown expected_source {$source}";
            }

            $this->validateLevel(['level' => $row['expected_level'] ?? null], 1, $errors);
        }

        return $errors;
    }

    /** @return array<string, mixed> */
    public function sources(): array
    {
        $path = database_path('reference/linguistics/sources.json');
        $decoded = json_decode((string) file_get_contents($path), true);

        return is_array($decoded) ? $decoded : [];
    }

    /** @param array<string, mixed> $row @param list<string> $keys @return list<string> */
    private function required(array $row, array $keys, int $line): array
    {
        $errors = [];
        foreach ($keys as $key) {
            if (! array_key_exists($key, $row) || $row[$key] === '') {
                $errors[] = "line {$line}: missing {$key}";
            }
        }

        return $errors;
    }

    /** @param array<string, mixed> $row @param array<string, mixed> $sources @param list<string> $errors */
    private function validateSource(array $row, array $sources, int $line, array &$errors): void
    {
        $source = (string) ($row['source'] ?? '');
        if ($source !== '' && ! array_key_exists($source, $sources)) {
            $errors[] = "line {$line}: unknown source {$source}";
        }
    }

    /** @param array<string, mixed> $row @param list<string> $errors */
    private function validateLevel(array $row, int $line, array &$errors): void
    {
        $level = $row['level'] ?? null;
        if ($level !== null && ! in_array($level, self::LEVELS, true)) {
            $errors[] = "line {$line}: invalid CEFR level";
        }
    }

    /** @param array<string, mixed> $row @param list<string> $errors */
    private function validateWeight(array $row, int $line, array &$errors): void
    {
        if (isset($row['weight']) && (! is_int($row['weight']) || $row['weight'] < 1)) {
            $errors[] = "line {$line}: invalid weight";
        }
    }
}
