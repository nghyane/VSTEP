<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Validates ExamVersion structure against VSTEP official format.
 *
 * Rules are defined in config/vstep.php — not hardcoded in the validator.
 */
final class ExamVersionValidator
{
    private array $rules;

    public function __construct(?array $rules = null)
    {
        $this->rules = $rules ?? config('vstep', []);
    }

    /**
     * Validate a loaded ExamVersion model.
     *
     * @throws ValidationException with 'exam_version' errors + checklist payload
     */
    public function validateForVersion(object $version): void
    {
        $sections = collect($version->listeningSections ?? [])->values();
        $passages = collect($version->readingPassages ?? [])->values();
        $writingTasks = collect($version->writingTasks ?? [])->values();
        $speakingParts = collect($version->speakingParts ?? [])->values();

        $sectionItems = $sections
            ->flatMap(fn (object $section): Collection => collect($section->items ?? []))
            ->groupBy('section_id');
        $passageItems = $passages
            ->flatMap(fn (object $passage): Collection => collect($passage->items ?? []))
            ->groupBy('passage_id');

        $errors = $this->validateFixtureData(
            $sections,
            $sectionItems,
            $passages,
            $passageItems,
            $writingTasks,
            $speakingParts,
        );

        if ($errors === []) {
            return;
        }

        $exception = ValidationException::withMessages([
            'exam_version' => $errors,
        ]);
        $exception->response = response()->json([
            'message' => $errors[0].(count($errors) > 1 ? ' (và '.(count($errors) - 1).' lỗi khác)' : ''),
            'errors' => ['exam_version' => $errors],
            'checklist' => array_map(
                fn (string $error): array => ['label' => $error, 'pass' => false],
                $errors,
            ),
        ], 422);

        throw $exception;
    }

    /**
     * Validate raw fixture arrays and enforce the official reading text-length range.
     *
     * @param  Collection<int, array|object>  $sections
     * @param  Collection<int|string, Collection<int, array|object>>  $sectionItems
     * @param  Collection<int, array|object>  $passages
     * @param  Collection<int|string, Collection<int, array|object>>  $passageItems
     * @param  Collection<int, array|object>  $writingTasks
     * @param  Collection<int, array|object>  $speakingParts
     * @return list<string>
     */
    public function validateOfficialFixtureData(
        Collection $sections,
        Collection $sectionItems,
        Collection $passages,
        Collection $passageItems,
        Collection $writingTasks,
        Collection $speakingParts,
    ): array {
        return $this->validateFixtureData(
            $sections,
            $sectionItems,
            $passages,
            $passageItems,
            $writingTasks,
            $speakingParts,
            true,
        );
    }

    /**
     * @param  Collection<int, array|object>  $sections
     * @param  Collection<int|string, Collection<int, array|object>>  $sectionItems  grouped by section id or section index
     * @param  Collection<int, array|object>  $passages
     * @param  Collection<int|string, Collection<int, array|object>>  $passageItems  grouped by passage id or passage index
     * @param  Collection<int, array|object>  $writingTasks
     * @param  Collection<int, array|object>  $speakingParts
     * @return list<string>
     */
    public function validateFixtureData(
        Collection $sections,
        Collection $sectionItems,
        Collection $passages,
        Collection $passageItems,
        Collection $writingTasks,
        Collection $speakingParts,
        bool $strictTextLength = false,
    ): array {
        return [
            ...$this->checkListeningArray($sections, $sectionItems),
            ...$this->checkReadingArray($passages, $passageItems, $strictTextLength),
            ...$this->checkWritingArray($writingTasks),
            ...$this->checkSpeakingArray($speakingParts),
        ];
    }

    /** @param Collection<int, array|object> $sections @param Collection<int|string, Collection<int, array|object>> $itemsGrouped @return list<string> */
    private function checkListeningArray(Collection $sections, Collection $itemsGrouped): array
    {
        $errors = [];
        $parts = $this->rules['listening']['parts'] ?? [];
        $expectedTotal = (int) ($this->rules['listening']['total_questions'] ?? 0);
        $expectedOptions = (int) ($this->rules['listening']['options_per_question'] ?? 4);
        $actualTotal = 0;
        $durationTotal = 0;

        $this->validateNoOrphanGroups($sections, $itemsGrouped, 'Listening items', $errors);

        foreach ($sections as $sectionIndex => $section) {
            $label = 'Listening section '.$this->rowLabel($section, $sectionIndex, 'part_title');
            $part = $this->intField($section, 'part');
            if ($part === null || ! array_key_exists($part, $parts)) {
                $errors[] = "{$label}: part must be one of [".implode(', ', array_keys($parts)).'].';
            }
            $this->requireStringField($section, 'part_title', "{$label} title", $errors);
            $this->requirePositiveIntField($section, 'duration_minutes', "{$label} duration_minutes", $errors);
            $durationTotal += $this->intField($section, 'duration_minutes') ?? 0;
            if (! $this->hasNonEmptyStringField($section, 'audio_url') && ! $this->hasNonEmptyStringField($section, 'transcript')) {
                $errors[] = "{$label}: audio_url or transcript is required.";
            }
        }

        foreach ($parts as $partNum => $rule) {
            $partSections = $sections->filter(
                fn (array|object $section): bool => $this->intField($section, 'part') === (int) $partNum,
            );
            $this->assertCount($partSections->count(), (int) $rule['sections'], "Listening Part {$partNum} sections", $errors);

            foreach ($partSections as $sectionIndex => $section) {
                $items = $this->itemsForParent($itemsGrouped, $section, $sectionIndex);
                $actualTotal += $items->count();
                $title = $this->stringField($section, 'part_title') ?: '#'.((string) $sectionIndex);
                $this->assertCount(
                    $items->count(),
                    (int) $rule['items_per_section'],
                    "Listening Part {$partNum} section '{$title}' items",
                    $errors,
                );

                foreach ($items->values() as $itemIndex => $item) {
                    $this->validateMcqItem($item, "Listening Part {$partNum} section '{$title}' question ".($itemIndex + 1), $expectedOptions, $errors);
                }
            }
        }

        if ($expectedTotal > 0) {
            $this->assertCount($actualTotal, $expectedTotal, 'Listening total questions', $errors);
        }

        $expectedDuration = (int) ($this->rules['listening']['duration_minutes'] ?? 0);
        if ($expectedDuration > 0 && $durationTotal > $expectedDuration) {
            $errors[] = "Listening duration: expected at most {$expectedDuration} minutes, got {$durationTotal}.";
        }

        return $errors;
    }

    /** @param Collection<int, array|object> $passages @param Collection<int|string, Collection<int, array|object>> $itemsGrouped @return list<string> */
    private function checkReadingArray(Collection $passages, Collection $itemsGrouped, bool $strictTextLength): array
    {
        $errors = [];
        $expectedPassages = (int) ($this->rules['reading']['passages'] ?? 0);
        $expectedItems = (int) ($this->rules['reading']['items_per_passage'] ?? 0);
        $expectedTotal = (int) ($this->rules['reading']['total_questions'] ?? 0);
        $expectedOptions = (int) ($this->rules['reading']['options_per_question'] ?? 4);
        $requiredParts = $this->rules['reading']['required_parts'] ?? [];
        $actualTotal = 0;
        $durationTotal = 0;
        $wordTotal = 0;

        $this->validateNoOrphanGroups($passages, $itemsGrouped, 'Reading items', $errors);
        $this->assertCount($passages->count(), $expectedPassages, 'Reading passages', $errors);

        foreach ($requiredParts as $part) {
            $partPassages = $passages->filter(
                fn (array|object $passage): bool => $this->intField($passage, 'part') === (int) $part,
            );
            $this->assertCount($partPassages->count(), 1, "Reading Part {$part} passages", $errors);
        }

        foreach ($passages as $passageIndex => $passage) {
            $label = 'Reading passage '.$this->rowLabel($passage, $passageIndex, 'title');
            $part = $this->intField($passage, 'part');
            if ($part === null || ! in_array($part, $requiredParts, true)) {
                $errors[] = "{$label}: part must be one of [".implode(', ', $requiredParts).'].';
            }
            $this->requireStringField($passage, 'title', "{$label} title", $errors);
            $this->requireStringField($passage, 'passage', "{$label} text", $errors);
            $this->requirePositiveIntField($passage, 'duration_minutes', "{$label} duration_minutes", $errors);

            $durationTotal += $this->intField($passage, 'duration_minutes') ?? 0;
            $wordTotal += $this->wordCount((string) ($this->value($passage, 'passage') ?? ''));

            $items = $this->itemsForParent($itemsGrouped, $passage, $passageIndex);
            $actualTotal += $items->count();
            $title = $this->stringField($passage, 'title') ?: '#'.((string) $passageIndex);
            $this->assertCount($items->count(), $expectedItems, "Reading passage '{$title}' items", $errors);

            foreach ($items->values() as $itemIndex => $item) {
                $this->validateMcqItem($item, "Reading passage '{$title}' question ".($itemIndex + 1), $expectedOptions, $errors);
            }
        }

        if ($expectedTotal > 0) {
            $this->assertCount($actualTotal, $expectedTotal, 'Reading total questions', $errors);
        }

        $expectedDuration = (int) ($this->rules['reading']['duration_minutes'] ?? 0);
        if ($expectedDuration > 0 && $durationTotal !== $expectedDuration) {
            $errors[] = "Reading duration: expected {$expectedDuration} minutes, got {$durationTotal}.";
        }

        if ($strictTextLength) {
            $range = $this->rules['reading']['total_words'] ?? [];
            $min = (int) ($range['min'] ?? 0);
            $max = (int) ($range['max'] ?? 0);
            if ($min > 0 && $max > 0 && ($wordTotal < $min || $wordTotal > $max)) {
                $errors[] = "Reading total words: expected {$min}-{$max}, got {$wordTotal}.";
            }
        }

        return $errors;
    }

    /** @param Collection<int, array|object> $tasks @return list<string> */
    private function checkWritingArray(Collection $tasks): array
    {
        $errors = [];
        $expectedCount = (int) ($this->rules['writing']['tasks'] ?? 0);
        $expectedTypes = $this->rules['writing']['required_types'] ?? [];
        $partRules = $this->rules['writing']['parts'] ?? [];
        sort($expectedTypes);

        $this->assertCount($tasks->count(), $expectedCount, 'Writing tasks', $errors);

        $actualTypes = $tasks
            ->map(fn (array|object $task): string => (string) ($this->value($task, 'task_type') ?? ''))
            ->sort()
            ->values()
            ->all();
        if ($actualTypes !== $expectedTypes) {
            $missing = array_diff($expectedTypes, $actualTypes);
            $detail = $missing ? ' Missing: '.implode(', ', $missing).'.' : '';
            $errors[] = 'Writing task types: expected ['.implode(', ', $expectedTypes).'], got ['.implode(', ', $actualTypes)."].{$detail}";
        }

        foreach ($tasks as $taskIndex => $task) {
            $label = 'Writing task '.$this->rowLabel($task, $taskIndex, 'part');
            $part = $this->intField($task, 'part');
            if ($part === null || ! array_key_exists($part, $partRules)) {
                $errors[] = "{$label}: part must be one of [".implode(', ', array_keys($partRules)).'].';

                continue;
            }

            $rule = $partRules[$part];
            $this->requireStringField($task, 'prompt', "{$label} prompt", $errors);
            $this->assertFieldEquals($task, 'task_type', (string) $rule['task_type'], "{$label} task_type", $errors);
            $this->assertIntFieldEquals($task, 'duration_minutes', (int) $rule['duration_minutes'], "{$label} duration_minutes", $errors);
            $minWords = $this->intField($task, 'min_words');
            if ($minWords === null || $minWords < (int) $rule['min_words']) {
                $errors[] = "{$label} min_words: expected at least {$rule['min_words']}, got ".($minWords ?? 'null').'.';
            }

            if (! $this->hasNonEmptyStringList($this->value($task, 'instructions'))
                && ! $this->hasNonEmptyStringList($this->value($task, 'requirements'))) {
                $errors[] = "{$label}: instructions or requirements must contain at least one required point.";
            }
        }

        foreach ($partRules as $part => $_rule) {
            $partTasks = $tasks->filter(fn (array|object $task): bool => $this->intField($task, 'part') === (int) $part);
            $this->assertCount($partTasks->count(), 1, "Writing Part {$part} tasks", $errors);
        }

        return $errors;
    }

    /** @param Collection<int, array|object> $parts @return list<string> */
    private function checkSpeakingArray(Collection $parts): array
    {
        $errors = [];
        $expectedCount = (int) ($this->rules['speaking']['parts'] ?? 0);
        $partRules = $this->rules['speaking']['part_rules'] ?? [];
        $durationTotal = 0;

        $this->assertCount($parts->count(), $expectedCount, 'Speaking parts', $errors);

        foreach ($parts as $partIndex => $part) {
            $label = 'Speaking part '.$this->rowLabel($part, $partIndex, 'part');
            $partNum = $this->intField($part, 'part');
            if ($partNum === null || ! array_key_exists($partNum, $partRules)) {
                $errors[] = "{$label}: part must be one of [".implode(', ', array_keys($partRules)).'].';

                continue;
            }

            $rule = $partRules[$partNum];
            $durationTotal += $this->intField($part, 'duration_minutes') ?? 0;
            $this->assertFieldEquals($part, 'type', (string) $rule['type'], "{$label} type", $errors);
            $this->assertIntFieldEquals($part, 'duration_minutes', (int) $rule['duration_minutes'], "{$label} duration_minutes", $errors);
            $this->assertIntFieldEquals($part, 'speaking_seconds', (int) $rule['speaking_seconds'], "{$label} speaking_seconds", $errors);
            $this->validateSpeakingContent($partNum, $this->value($part, 'content'), $rule, $label, $errors);
        }

        foreach ($partRules as $part => $_rule) {
            $partMatches = $parts->filter(fn (array|object $row): bool => $this->intField($row, 'part') === (int) $part);
            $this->assertCount($partMatches->count(), 1, "Speaking Part {$part}", $errors);
        }

        $expectedDuration = (int) ($this->rules['speaking']['duration_minutes'] ?? 0);
        if ($expectedDuration > 0 && $durationTotal !== $expectedDuration) {
            $errors[] = "Speaking duration: expected {$expectedDuration} minutes, got {$durationTotal}.";
        }

        return $errors;
    }

    /** @param list<string> $errors */
    private function validateMcqItem(array|object $item, string $label, int $expected, array &$errors): void
    {
        $this->requireStringField($item, 'stem', "{$label} stem", $errors);

        $options = $this->arrayValue($this->value($item, 'options'));
        if (! is_array($options)) {
            $errors[] = "{$label} options: must be a JSON array.";

            return;
        }
        $this->assertCount(count($options), $expected, "{$label} options", $errors);
        foreach ($options as $optionIndex => $option) {
            if (! is_string($option) || trim($option) === '') {
                $errors[] = "{$label} option ".($optionIndex + 1).': must be a non-empty string.';
            }
        }
        if (count(array_unique(array_map(fn (mixed $option): string => trim((string) $option), $options))) !== count($options)) {
            $errors[] = "{$label} options: duplicate options are not allowed.";
        }

        $correctIndex = $this->intField($item, 'correct_index');
        if ($correctIndex === null || $correctIndex < 0 || $correctIndex >= $expected) {
            $errors[] = "{$label} correct_index: expected 0-".($expected - 1).', got '.($correctIndex ?? 'null').'.';
        }
    }

    /** @param array<string, mixed> $rule @param list<string> $errors */
    private function validateSpeakingContent(int $part, mixed $content, array $rule, string $label, array &$errors): void
    {
        $content = $this->arrayValue($content);
        if (! is_array($content) || $content === []) {
            $errors[] = "{$label} content: must be a non-empty JSON object.";

            return;
        }

        if ($part === 1) {
            $topics = $this->arrayValue($content['topics'] ?? null);
            if (! is_array($topics)) {
                $errors[] = "{$label} content.topics: must be an array.";

                return;
            }
            $this->assertCount(count($topics), (int) $rule['topics'], "{$label} topics", $errors);
            $questionCount = 0;
            foreach ($topics as $topicIndex => $topic) {
                $topicName = is_array($topic) ? ($topic['name'] ?? null) : null;
                if (! is_string($topicName) || trim($topicName) === '') {
                    $errors[] = "{$label} topic ".($topicIndex + 1).': name is required.';
                }
                $questions = is_array($topic) ? $this->arrayValue($topic['questions'] ?? null) : null;
                if (! is_array($questions) || $questions === []) {
                    $errors[] = "{$label} topic ".($topicIndex + 1).': questions are required.';

                    continue;
                }
                $questionCount += count($questions);
                $this->validateStringList($questions, "{$label} topic ".($topicIndex + 1).' questions', $errors);
            }
            $min = (int) $rule['questions_total_min'];
            $max = (int) $rule['questions_total_max'];
            if ($questionCount < $min || $questionCount > $max) {
                $errors[] = "{$label} questions: expected {$min}-{$max}, got {$questionCount}.";
            }

            return;
        }

        if ($part === 2) {
            $this->requireStringValue($content['situation'] ?? null, "{$label} content.situation", $errors);
            $solutions = $this->arrayValue($content['solutions'] ?? null);
            if (! is_array($solutions)) {
                $errors[] = "{$label} content.solutions: must be an array.";
            } else {
                $this->assertCount(count($solutions), (int) $rule['solutions'], "{$label} solutions", $errors);
                $this->validateStringList($solutions, "{$label} solutions", $errors);
            }
            $this->requireStringValue($content['task'] ?? null, "{$label} content.task", $errors);

            return;
        }

        $this->requireStringValue($content['topic'] ?? null, "{$label} content.topic", $errors);
        $this->requireStringValue($content['prompt'] ?? null, "{$label} content.prompt", $errors);
        $questions = $this->arrayValue($content['follow_up_questions'] ?? null);
        if (! is_array($questions)) {
            $errors[] = "{$label} content.follow_up_questions: must be an array.";

            return;
        }
        $min = (int) $rule['follow_up_questions_min'];
        if (count($questions) < $min) {
            $errors[] = "{$label} follow_up_questions: expected at least {$min}, got ".count($questions).'.';
        }
        $this->validateStringList($questions, "{$label} follow_up_questions", $errors);
    }

    /** @param Collection<int, array|object> $parents @param Collection<int|string, mixed> $itemsGrouped @param list<string> $errors */
    private function validateNoOrphanGroups(Collection $parents, Collection $itemsGrouped, string $label, array &$errors): void
    {
        $keys = [];
        foreach ($parents as $index => $parent) {
            $id = $this->value($parent, 'id');
            if ($id !== null && $id !== '') {
                $keys[(string) $id] = true;
            }
            $keys[(string) $index] = true;
        }

        foreach ($itemsGrouped as $groupKey => $_items) {
            if (! isset($keys[(string) $groupKey])) {
                $errors[] = "{$label}: parent key {$groupKey} does not match any parent row.";
            }
        }
    }

    /** @param Collection<int|string, mixed> $itemsGrouped */
    private function itemsForParent(Collection $itemsGrouped, array|object $parent, int|string $index): Collection
    {
        $id = $this->value($parent, 'id');
        foreach ([$id, $index, (string) $index] as $key) {
            if ($key !== null && $itemsGrouped->has($key)) {
                return collect($itemsGrouped->get($key));
            }
        }

        return collect();
    }

    /** @param list<string> $errors */
    private function assertCount(int $actual, int $expected, string $label, array &$errors): void
    {
        if ($actual !== $expected) {
            $errors[] = "{$label}: yêu cầu {$expected}, hiện có {$actual}.";
        }
    }

    /** @param list<string> $errors */
    private function assertFieldEquals(array|object $row, string $field, string $expected, string $label, array &$errors): void
    {
        $actual = (string) ($this->value($row, $field) ?? '');
        if ($actual !== $expected) {
            $errors[] = "{$label}: expected {$expected}, got ".($actual !== '' ? $actual : 'null').'.';
        }
    }

    /** @param list<string> $errors */
    private function assertIntFieldEquals(array|object $row, string $field, int $expected, string $label, array &$errors): void
    {
        $actual = $this->intField($row, $field);
        if ($actual !== $expected) {
            $errors[] = "{$label}: expected {$expected}, got ".($actual ?? 'null').'.';
        }
    }

    /** @param list<string> $errors */
    private function requireStringField(array|object $row, string $field, string $label, array &$errors): void
    {
        $this->requireStringValue($this->value($row, $field), $label, $errors);
    }

    /** @param list<string> $errors */
    private function requireStringValue(mixed $value, string $label, array &$errors): void
    {
        if (! is_string($value) || trim($value) === '') {
            $errors[] = "{$label}: must be a non-empty string.";
        }
    }

    /** @param list<string> $errors */
    private function requirePositiveIntField(array|object $row, string $field, string $label, array &$errors): void
    {
        $value = $this->intField($row, $field);
        if ($value === null || $value <= 0) {
            $errors[] = "{$label}: must be a positive integer.";
        }
    }

    /** @param list<mixed> $items @param list<string> $errors */
    private function validateStringList(array $items, string $label, array &$errors): void
    {
        foreach ($items as $index => $item) {
            if (! is_string($item) || trim($item) === '') {
                $errors[] = "{$label} item ".($index + 1).': must be a non-empty string.';
            }
        }
    }

    private function rowLabel(array|object $row, int|string $index, string $field): string
    {
        $value = $this->value($row, $field);
        if (is_string($value) && trim($value) !== '') {
            return "'{$value}'";
        }
        if (is_int($value)) {
            return (string) $value;
        }

        return '#'.((string) $index);
    }

    private function value(array|object $row, string $field): mixed
    {
        if (is_array($row)) {
            return $row[$field] ?? null;
        }

        return $row->{$field} ?? null;
    }

    private function stringField(array|object $row, string $field): ?string
    {
        $value = $this->value($row, $field);

        return is_string($value) ? trim($value) : null;
    }

    private function intField(array|object $row, string $field): ?int
    {
        $value = $this->value($row, $field);
        if (is_int($value)) {
            return $value;
        }
        if (is_numeric($value) && (string) (int) $value === (string) $value) {
            return (int) $value;
        }

        return null;
    }

    private function hasNonEmptyStringField(array|object $row, string $field): bool
    {
        $value = $this->value($row, $field);

        return is_string($value) && trim($value) !== '';
    }

    private function hasNonEmptyStringList(mixed $value): bool
    {
        $items = $this->arrayValue($value);
        if (! is_array($items) || $items === []) {
            return false;
        }

        foreach ($items as $item) {
            if (! is_string($item) || trim($item) === '') {
                return false;
            }
        }

        return true;
    }

    /** @return array<mixed>|null */
    private function arrayValue(mixed $value): ?array
    {
        if (is_array($value)) {
            return $value;
        }
        if (is_string($value)) {
            $decoded = json_decode($value, true);

            return is_array($decoded) ? $decoded : null;
        }

        return null;
    }

    private function wordCount(string $text): int
    {
        return str_word_count(strip_tags($text));
    }
}
