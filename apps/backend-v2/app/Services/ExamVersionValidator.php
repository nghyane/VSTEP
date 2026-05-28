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
final class ExamVersionValidator
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
     * @throws ValidationException with 'exam_version' errors + 'checklist' (pass/fail per item)
     */
    public function validateForVersion(object $version): void
    {
        $sections = $version->listeningSections ?? collect();
        $passages = $version->readingPassages ?? collect();
        $writingTasks = $version->writingTasks ?? collect();
        $speakingParts = $version->speakingParts ?? collect();

        $listeningItems = $sections->flatMap(fn ($s) => $s->items ?? collect());
        $readingItems = $passages->flatMap(fn ($p) => $p->items ?? collect());

        $checklist = [
            ...$this->checkListeningChecklist($sections, $listeningItems),
            ...$this->checkReadingChecklist($passages, $readingItems),
            ...$this->checkWritingChecklist($writingTasks),
            ...$this->checkSpeakingChecklist($speakingParts),
        ];

        $errors = array_map(
            fn ($item) => $item['label'],
            array_filter($checklist, fn ($item) => ! $item['pass']),
        );

        if ($errors) {
            $exception = ValidationException::withMessages([
                'exam_version' => array_values($errors),
            ]);
            $exception->response = response()->json([
                'message' => array_values($errors)[0].(count($errors) > 1 ? ' (và '.(count($errors) - 1).' lỗi khác)' : ''),
                'errors' => ['exam_version' => array_values($errors)],
                'checklist' => $checklist,
            ], 422);

            throw $exception;
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
    // Raw array checks (used by validateFixtureData)
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
            $errors[] = "{$label}: yêu cầu {$expected}, hiện có {$actual}.";
        }
    }

    /** @return list<array{label: string, pass: bool}> */
    private function checkListeningChecklist(Collection $sections, Collection $items): array
    {
        $checklist = [];
        $parts = $this->rules['listening']['parts'] ?? [];

        foreach ($parts as $partNum => $rule) {
            $partSections = $sections->where('part', $partNum);
            $pass = $partSections->count() === $rule['sections'];
            $checklist[] = [
                'label' => "Nghe Phần {$partNum} — số đoạn: yêu cầu {$rule['sections']}, hiện có {$partSections->count()}.",
                'pass' => $pass,
            ];

            foreach ($partSections as $section) {
                $itemCount = $items->where('section_id', $section->id)->count();
                $itemPass = $itemCount === $rule['items_per_section'];
                $checklist[] = [
                    'label' => "Nghe Phần {$partNum} đoạn \"{$section->part_title}\" — số câu hỏi: yêu cầu {$rule['items_per_section']}, hiện có {$itemCount}.",
                    'pass' => $itemPass,
                ];
            }
        }

        return $checklist;
    }

    /** @return list<array{label: string, pass: bool}> */
    private function checkReadingChecklist(Collection $passages, Collection $items): array
    {
        $checklist = [];
        $expectedPassages = $this->rules['reading']['passages'];
        $expectedItems = $this->rules['reading']['items_per_passage'];

        $pass = $passages->count() === $expectedPassages;
        $checklist[] = [
            'label' => "Đọc — số bài đọc: yêu cầu {$expectedPassages}, hiện có {$passages->count()}.",
            'pass' => $pass,
        ];

        foreach ($passages as $passage) {
            $itemCount = $items->where('passage_id', $passage->id)->count();
            $itemPass = $itemCount === $expectedItems;
            $checklist[] = [
                'label' => "Đọc bài \"{$passage->title}\" — số câu hỏi: yêu cầu {$expectedItems}, hiện có {$itemCount}.",
                'pass' => $itemPass,
            ];
        }

        return $checklist;
    }

    /** @return list<array{label: string, pass: bool}> */
    private function checkWritingChecklist(Collection $tasks): array
    {
        $checklist = [];
        $expectedCount = $this->rules['writing']['tasks'];
        $expectedTypes = $this->rules['writing']['required_types'];
        sort($expectedTypes);

        $pass = $tasks->count() === $expectedCount;
        $checklist[] = [
            'label' => "Viết — số bài: yêu cầu {$expectedCount}, hiện có {$tasks->count()}.",
            'pass' => $pass,
        ];

        $actualTypes = $tasks->pluck('task_type')->sort()->values()->all();
        $typesPass = $actualTypes === $expectedTypes;
        if (! $typesPass) {
            $missing = array_diff($expectedTypes, $actualTypes);
            $detail = $missing ? ' Thiếu: '.implode(', ', $missing).'.' : '';
            $checklist[] = [
                'label' => 'Viết — loại bài: yêu cầu ['.implode(', ', $expectedTypes).'], hiện có ['.implode(', ', $actualTypes)."].{$detail}",
                'pass' => false,
            ];
        } else {
            $checklist[] = [
                'label' => 'Viết — loại bài: đầy đủ (letter, essay).',
                'pass' => true,
            ];
        }

        return $checklist;
    }

    /** @return list<array{label: string, pass: bool}> */
    private function checkSpeakingChecklist(Collection $parts): array
    {
        $checklist = [];
        $expected = $this->rules['speaking']['parts'];

        $pass = $parts->count() === $expected;
        $checklist[] = [
            'label' => "Nói — số phần: yêu cầu {$expected}, hiện có {$parts->count()}.",
            'pass' => $pass,
        ];

        foreach ($parts as $part) {
            $contentPass = ! empty($part->content);
            $checklist[] = [
                'label' => "Nói Phần {$part->part}: ".($contentPass ? 'có nội dung.' : 'nội dung trống.'),
                'pass' => $contentPass,
            ];
        }

        return $checklist;
    }
}
