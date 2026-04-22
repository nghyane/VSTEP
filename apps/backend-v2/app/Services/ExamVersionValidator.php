<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Validates ExamVersion structure against VSTEP official format.
 *
 * Rules are defined in config/vstep.php — not hardcoded in the validator.
 *
 * Usage:
 *   // Service layer (loaded models)
 *   $validator->validateForVersion($version);
 *
 *   // Seeder layer (raw fixture arrays)
 *   $errors = $validator->validateFixtureData($sections, $sectionItems, ...);
 */
class ExamVersionValidator
{
    private array $rules;

    public function __construct(?array $rules = null)
    {
        $this->rules = $rules ?? config('vstep', []);
    }

    // ──────────────────────────────────────────────
    // Public: validate loaded Eloquent ExamVersion
    // ──────────────────────────────────────────────

    /**
     * Validate a loaded ExamVersion model (relationships eager-loaded).
     *
     * @throws ValidationException
     */
    public function validateForVersion(object $version): void
    {
        $errors = [];

        $sections = $version->listeningSections ?? collect();
        $passages = $version->readingPassages ?? collect();
        $writingTasks = $version->writingTasks ?? collect();
        $speakingParts = $version->speakingParts ?? collect();

        // Flatten child items
        $listeningItems = $sections->flatMap(fn ($s) => $s->items ?? collect());
        $readingItems = $passages->flatMap(fn ($p) => $p->items ?? collect());

        $errors = [
            ...$this->checkListening($sections, $listeningItems),
            ...$this->checkReading($passages, $readingItems),
            ...$this->checkWriting($writingTasks),
            ...$this->checkSpeaking($speakingParts),
        ];

        if ($errors) {
            throw ValidationException::withMessages(['exam_version' => $errors]);
        }
    }

    // ──────────────────────────────────────────────
    // Public: validate raw fixture arrays
    // ──────────────────────────────────────────────

    /**
     * @param  Collection<int, array>  $sections
     * @param  Collection<int, array>  $sectionItems  grouped by section_id (keys are section UUIDs)
     * @param  Collection<int, array>  $passages
     * @param  Collection<int, array>  $passageItems  grouped by passage_id (keys are passage UUIDs)
     * @param  Collection<int, array>  $writingTasks
     * @param  Collection<int, array>  $speakingParts
     * @return list<string>
     */
    public function validateFixtureData(
        Collection $sections,
        Collection $sectionItems,
        Collection $passages,
        Collection $passageItems,
        Collection $writingTasks,
        Collection $speakingParts,
    ): array {
        return [
            ...$this->checkListeningArray($sections, $sectionItems),
            ...$this->checkReadingArray($passages, $passageItems),
            ...$this->checkWritingArray($writingTasks),
            ...$this->checkSpeakingArray($speakingParts),
        ];
    }

    // ──────────────────────────────────────────────
    // Eloquent model checks
    // ──────────────────────────────────────────────

    private function checkListening(Collection $sections, Collection $items): array
    {
        $errors = [];
        $parts = $this->rules['listening']['parts'] ?? [];

        foreach ($parts as $partNum => $rule) {
            $partSections = $sections->where('part', $partNum);
            $this->assertCount(
                $partSections->count(),
                $rule['sections'],
                "Listening Part {$partNum} sections",
                $errors,
            );

            foreach ($partSections as $section) {
                $itemCount = $items->where('section_id', $section->id)->count();
                $this->assertCount(
                    $itemCount,
                    $rule['items_per_section'],
                    "Listening Part {$partNum} section '{$section->part_title}' items",
                    $errors,
                );
            }
        }

        return $errors;
    }

    private function checkReading(Collection $passages, Collection $items): array
    {
        $errors = [];
        $expectedPassages = $this->rules['reading']['passages'];
        $expectedItems = $this->rules['reading']['items_per_passage'];

        $this->assertCount($passages->count(), $expectedPassages, 'Reading passages', $errors);

        foreach ($passages as $passage) {
            $itemCount = $items->where('passage_id', $passage->id)->count();
            $this->assertCount(
                $itemCount,
                $expectedItems,
                "Reading passage '{$passage->title}' items",
                $errors,
            );
        }

        return $errors;
    }

    private function checkWriting(Collection $tasks): array
    {
        $errors = [];
        $expectedCount = $this->rules['writing']['tasks'];
        $expectedTypes = $this->rules['writing']['required_types'];
        sort($expectedTypes);

        $this->assertCount($tasks->count(), $expectedCount, 'Writing tasks', $errors);

        $actualTypes = $tasks->pluck('task_type')->sort()->values()->all();
        if ($actualTypes !== $expectedTypes) {
            $missing = array_diff($expectedTypes, $actualTypes);
            $detail = $missing ? ' Missing: '.implode(', ', $missing).'.' : '';
            $errors[] = 'Writing task types: expected ['.implode(', ', $expectedTypes).'], got ['.implode(', ', $actualTypes)."].{$detail}";
        }

        return $errors;
    }

    private function checkSpeaking(Collection $parts): array
    {
        $errors = [];
        $expected = $this->rules['speaking']['parts'];

        $this->assertCount($parts->count(), $expected, 'Speaking parts', $errors);

        foreach ($parts as $part) {
            if (empty($part->content)) {
                $errors[] = "Speaking Part {$part->part}: content is empty.";
            }
        }

        return $errors;
    }

    // ──────────────────────────────────────────────
    // Raw array checks
    // ──────────────────────────────────────────────

    private function checkListeningArray(Collection $sections, Collection $itemsGrouped): array
    {
        $errors = [];
        $parts = $this->rules['listening']['parts'] ?? [];

        foreach ($parts as $partNum => $rule) {
            $partSections = $sections->where('part', $partNum);
            $this->assertCount(
                $partSections->count(),
                $rule['sections'],
                "Listening Part {$partNum} sections",
                $errors,
            );

            foreach ($partSections as $section) {
                $itemCount = $itemsGrouped->get($section['id'], collect())->count();
                $this->assertCount(
                    $itemCount,
                    $rule['items_per_section'],
                    "Listening Part {$partNum} section '{$section['part_title']}' items",
                    $errors,
                );
            }
        }

        return $errors;
    }

    private function checkReadingArray(Collection $passages, Collection $itemsGrouped): array
    {
        $errors = [];
        $expectedPassages = $this->rules['reading']['passages'];
        $expectedItems = $this->rules['reading']['items_per_passage'];

        $this->assertCount($passages->count(), $expectedPassages, 'Reading passages', $errors);

        foreach ($passages as $passage) {
            $itemCount = $itemsGrouped->get($passage['id'], collect())->count();
            $this->assertCount(
                $itemCount,
                $expectedItems,
                "Reading passage '{$passage['title']}' items",
                $errors,
            );
        }

        return $errors;
    }

    private function checkWritingArray(Collection $tasks): array
    {
        $errors = [];
        $expectedCount = $this->rules['writing']['tasks'];
        $expectedTypes = $this->rules['writing']['required_types'];
        sort($expectedTypes);

        $this->assertCount($tasks->count(), $expectedCount, 'Writing tasks', $errors);

        $actualTypes = $tasks->pluck('task_type')->sort()->values()->all();
        if ($actualTypes !== $expectedTypes) {
            $missing = array_diff($expectedTypes, $actualTypes);
            $detail = $missing ? ' Missing: '.implode(', ', $missing).'.' : '';
            $errors[] = 'Writing task types: expected ['.implode(', ', $expectedTypes).'], got ['.implode(', ', $actualTypes)."].{$detail}";
        }

        return $errors;
    }

    private function checkSpeakingArray(Collection $parts): array
    {
        $errors = [];
        $expected = $this->rules['speaking']['parts'];

        $this->assertCount($parts->count(), $expected, 'Speaking parts', $errors);

        foreach ($parts as $part) {
            $content = $part['content'] ?? '';
            if (is_string($content) && trim($content) === '') {
                $errors[] = "Speaking Part {$part['part']}: content is empty.";
            } elseif (is_string($content)) {
                $decoded = json_decode($content, true);
                if (empty($decoded)) {
                    $errors[] = "Speaking Part {$part['part']}: content is empty or invalid JSON.";
                }
            }
        }

        return $errors;
    }

    // ──────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────

    /**
     * @param  list<string>  $errors
     */
    private function assertCount(int $actual, int $expected, string $label, array &$errors): void
    {
        if ($actual !== $expected) {
            $errors[] = "{$label}: expected {$expected}, got {$actual}.";
        }
    }
}
