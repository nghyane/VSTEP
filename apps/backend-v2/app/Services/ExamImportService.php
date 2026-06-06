<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Exam;
use App\Models\ExamVersion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class ExamImportService
{
    public function __construct(
        private readonly ExamVersionValidator $validator,
    ) {}

    /**
     * Import a complete exam with version and all content.
     *
     * Validates structure before inserting. All inserts are atomic.
     *
     * @param  array<string, mixed>  $examData  slug, title, source_school, tags, is_published
     * @param  array<string, mixed>  $versionData  version_number, published_at, + all content arrays
     *
     * @throws ValidationException If VSTEP structure rules are violated
     */
    public function importExam(array $examData, array $versionData): Exam
    {
        $this->validateStructure($versionData);
        $now = now()->toDateTimeString();

        return DB::transaction(fn () => $this->createExam($examData, $versionData, $now));
    }

    /**
     * Upsert a production reference exam without deleting old versions/sessions.
     * Existing active versions are preserved when content is unchanged; otherwise
     * a new active version is created and old sessions keep pointing to their
     * historical version.
     *
     * @param  array<string, mixed>  $examData
     * @param  array<string, mixed>  $versionData
     */
    public function syncExam(array $examData, array $versionData): Exam
    {
        $this->validateStructure($versionData);
        $now = now()->toDateTimeString();

        return DB::transaction(function () use ($examData, $versionData, $now): Exam {
            /** @var Exam|null $exam */
            $exam = Exam::query()->where('slug', $examData['slug'])->first();
            if ($exam === null) {
                return $this->createExam($examData, $versionData, $now);
            }

            $exam->update([
                'title' => $examData['title'],
                'source_school' => $examData['source_school'] ?? null,
                'tags' => $examData['tags'] ?? [],
                'total_duration_minutes' => $examData['total_duration_minutes'] ?? 0,
                'is_published' => (bool) ($examData['is_published'] ?? false),
            ]);

            /** @var ExamVersion|null $activeVersion */
            $activeVersion = $exam->versions()
                ->where('is_active', true)
                ->orderByDesc('version_number')
                ->first();

            if ($activeVersion !== null && $this->versionMatches($activeVersion, $versionData)) {
                $exam->versions()
                    ->where('is_active', true)
                    ->where('id', '!=', $activeVersion->id)
                    ->update(['is_active' => false]);

                return $exam->fresh(['versions']);
            }

            $exam->versions()->where('is_active', true)->update(['is_active' => false]);

            $version = $exam->versions()->create([
                'version_number' => ((int) $exam->versions()->max('version_number')) + 1,
                'published_at' => $versionData['published_at'] ?? $now,
                'is_active' => true,
                'created_at' => $now,
            ]);

            $this->insertExamContent($version, $versionData);

            return $exam->fresh(['versions']);
        });
    }

    /** @param array<string, mixed> $examData @param array<string, mixed> $versionData */
    private function createExam(array $examData, array $versionData, string $now): Exam
    {
        $exam = Exam::create([
            ...$examData,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $version = $exam->versions()->create([
            'version_number' => $versionData['version_number'],
            'published_at' => $versionData['published_at'] ?? $now,
            'is_active' => true,
            'created_at' => $now,
        ]);

        $this->insertExamContent($version, $versionData);

        return $exam->fresh(['versions']);
    }

    /**
     * Insert all exam content within the service's transaction context.
     *
     * @param  array<string, mixed>  $versionData
     */
    private function insertExamContent(ExamVersion $version, array $versionData): void
    {
        $now = now()->toDateTimeString();

        // Listening sections
        foreach ($versionData['listening_sections'] ?? [] as $index => $section) {
            $sectionId = Str::orderedUuid()->toString();
            DB::table('exam_version_listening_sections')->insert([
                'id' => $sectionId,
                'exam_version_id' => $version->id,
                'part' => $section['part'],
                'part_title' => $section['part_title'],
                'duration_minutes' => $section['duration_minutes'],
                'audio_url' => $section['audio_url'] ?? null,
                'transcript' => $section['transcript'] ?? null,
                'display_order' => $section['display_order'] ?? $index,
            ]);

            // Listening items for this section
            $sectionItems = collect($versionData['listening_items'] ?? [])
                ->where('section_index', $index);
            foreach ($sectionItems as $itemIndex => $item) {
                DB::table('exam_version_listening_items')->insert([
                    'id' => Str::orderedUuid()->toString(),
                    'section_id' => $sectionId,
                    'display_order' => $item['display_order'] ?? $itemIndex,
                    'stem' => $item['stem'],
                    'options' => json_encode($item['options'], JSON_UNESCAPED_UNICODE),
                    'correct_index' => $item['correct_index'],
                ]);
            }
        }

        // Reading passages
        foreach ($versionData['reading_passages'] ?? [] as $index => $passage) {
            $passageId = Str::orderedUuid()->toString();
            DB::table('exam_version_reading_passages')->insert([
                'id' => $passageId,
                'exam_version_id' => $version->id,
                'part' => $passage['part'] ?? ($index + 1),
                'title' => $passage['title'],
                'duration_minutes' => $passage['duration_minutes'],
                'passage' => $passage['passage'],
                'display_order' => $passage['display_order'] ?? $index,
            ]);

            // Reading items for this passage
            $passageItems = collect($versionData['reading_items'] ?? [])
                ->where('passage_index', $index);
            foreach ($passageItems as $itemIndex => $item) {
                DB::table('exam_version_reading_items')->insert([
                    'id' => Str::orderedUuid()->toString(),
                    'passage_id' => $passageId,
                    'display_order' => $item['display_order'] ?? $itemIndex,
                    'stem' => $item['stem'],
                    'options' => json_encode($item['options'], JSON_UNESCAPED_UNICODE),
                    'correct_index' => $item['correct_index'],
                ]);
            }
        }

        // Writing tasks
        foreach ($versionData['writing_tasks'] ?? [] as $index => $task) {
            DB::table('exam_version_writing_tasks')->insert([
                'id' => Str::orderedUuid()->toString(),
                'exam_version_id' => $version->id,
                'part' => $task['part'],
                'task_type' => $task['task_type'],
                'duration_minutes' => $task['duration_minutes'],
                'prompt' => $task['prompt'],
                'min_words' => $task['min_words'],
                'instructions' => isset($task['instructions']) ? json_encode($task['instructions'], JSON_UNESCAPED_UNICODE) : null,
                'requirements' => isset($task['requirements']) ? json_encode($task['requirements'], JSON_UNESCAPED_UNICODE) : null,
                'display_order' => $task['display_order'] ?? $index,
            ]);
        }

        // Speaking parts
        foreach ($versionData['speaking_parts'] ?? [] as $index => $part) {
            DB::table('exam_version_speaking_parts')->insert([
                'id' => Str::orderedUuid()->toString(),
                'exam_version_id' => $version->id,
                'part' => $part['part'],
                'type' => $part['type'],
                'duration_minutes' => $part['duration_minutes'],
                'speaking_seconds' => $part['speaking_seconds'],
                'content' => json_encode($part['content'], JSON_UNESCAPED_UNICODE),
                'requirements' => isset($part['requirements']) ? json_encode($part['requirements'], JSON_UNESCAPED_UNICODE) : null,
                'display_order' => $part['display_order'] ?? $index,
            ]);
        }
    }

    /** @param array<string, mixed> $versionData */
    private function versionMatches(ExamVersion $version, array $versionData): bool
    {
        return $this->normalizeForCompare($this->actualVersionContent($version))
            === $this->normalizeForCompare($this->expectedVersionContent($versionData));
    }

    /** @return array<string, mixed> */
    private function actualVersionContent(ExamVersion $version): array
    {
        $version->loadMissing([
            'listeningSections.items',
            'readingPassages.items',
            'writingTasks',
            'speakingParts',
        ]);

        return [
            'listening_sections' => $version->listeningSections->values()->map(fn ($section): array => [
                'part' => (int) $section->part,
                'part_title' => $section->part_title,
                'duration_minutes' => (int) $section->duration_minutes,
                'audio_url' => $section->audio_url,
                'transcript' => $section->transcript,
                'display_order' => (int) $section->display_order,
                'items' => $section->items->values()->map(fn ($item): array => [
                    'display_order' => (int) $item->display_order,
                    'stem' => $item->stem,
                    'options' => $item->options,
                    'correct_index' => (int) $item->correct_index,
                ])->all(),
            ])->all(),
            'reading_passages' => $version->readingPassages->values()->map(fn ($passage): array => [
                'part' => (int) $passage->part,
                'title' => $passage->title,
                'duration_minutes' => (int) $passage->duration_minutes,
                'passage' => $passage->passage,
                'display_order' => (int) $passage->display_order,
                'items' => $passage->items->values()->map(fn ($item): array => [
                    'display_order' => (int) $item->display_order,
                    'stem' => $item->stem,
                    'options' => $item->options,
                    'correct_index' => (int) $item->correct_index,
                ])->all(),
            ])->all(),
            'writing_tasks' => $version->writingTasks->values()->map(fn ($task): array => [
                'part' => (int) $task->part,
                'task_type' => $task->task_type,
                'duration_minutes' => (int) $task->duration_minutes,
                'prompt' => $task->prompt,
                'min_words' => (int) $task->min_words,
                'instructions' => $task->instructions,
                'requirements' => $task->requirements,
                'display_order' => (int) $task->display_order,
            ])->all(),
            'speaking_parts' => $version->speakingParts->values()->map(fn ($part): array => [
                'part' => (int) $part->part,
                'type' => $part->type,
                'duration_minutes' => (int) $part->duration_minutes,
                'speaking_seconds' => (int) $part->speaking_seconds,
                'content' => $part->content,
                'requirements' => $part->requirements,
                'display_order' => (int) $part->display_order,
            ])->all(),
        ];
    }

    /** @param array<string, mixed> $versionData @return array<string, mixed> */
    private function expectedVersionContent(array $versionData): array
    {
        $listeningItemsBySection = collect($versionData['listening_items'] ?? [])->groupBy('section_index');
        $readingItemsByPassage = collect($versionData['reading_items'] ?? [])->groupBy('passage_index');

        return [
            'listening_sections' => collect($versionData['listening_sections'] ?? [])->values()->map(
                fn (array $section, int $index): array => [
                    'part' => (int) $section['part'],
                    'part_title' => $section['part_title'],
                    'duration_minutes' => (int) $section['duration_minutes'],
                    'audio_url' => $section['audio_url'] ?? null,
                    'transcript' => $section['transcript'] ?? null,
                    'display_order' => (int) ($section['display_order'] ?? $index),
                    'items' => collect($listeningItemsBySection->get($index, []))->values()->map(fn (array $item, int $itemIndex): array => [
                        'display_order' => (int) ($item['display_order'] ?? $itemIndex),
                        'stem' => $item['stem'],
                        'options' => $item['options'],
                        'correct_index' => (int) $item['correct_index'],
                    ])->all(),
                ],
            )->all(),
            'reading_passages' => collect($versionData['reading_passages'] ?? [])->values()->map(
                fn (array $passage, int $index): array => [
                    'part' => (int) ($passage['part'] ?? ($index + 1)),
                    'title' => $passage['title'],
                    'duration_minutes' => (int) $passage['duration_minutes'],
                    'passage' => $passage['passage'],
                    'display_order' => (int) ($passage['display_order'] ?? $index),
                    'items' => collect($readingItemsByPassage->get($index, []))->values()->map(fn (array $item, int $itemIndex): array => [
                        'display_order' => (int) ($item['display_order'] ?? $itemIndex),
                        'stem' => $item['stem'],
                        'options' => $item['options'],
                        'correct_index' => (int) $item['correct_index'],
                    ])->all(),
                ],
            )->all(),
            'writing_tasks' => collect($versionData['writing_tasks'] ?? [])->values()->map(fn (array $task, int $index): array => [
                'part' => (int) $task['part'],
                'task_type' => $task['task_type'],
                'duration_minutes' => (int) $task['duration_minutes'],
                'prompt' => $task['prompt'],
                'min_words' => (int) $task['min_words'],
                'instructions' => $task['instructions'] ?? null,
                'requirements' => $task['requirements'] ?? null,
                'display_order' => (int) ($task['display_order'] ?? $index),
            ])->all(),
            'speaking_parts' => collect($versionData['speaking_parts'] ?? [])->values()->map(fn (array $part, int $index): array => [
                'part' => (int) $part['part'],
                'type' => $part['type'],
                'duration_minutes' => (int) $part['duration_minutes'],
                'speaking_seconds' => (int) $part['speaking_seconds'],
                'content' => $part['content'],
                'requirements' => $part['requirements'] ?? null,
                'display_order' => (int) ($part['display_order'] ?? $index),
            ])->all(),
        ];
    }

    private function normalizeForCompare(mixed $value): mixed
    {
        if (is_array($value)) {
            $normalized = array_map(fn (mixed $item): mixed => $this->normalizeForCompare($item), $value);
            if (array_is_list($normalized)) {
                return $normalized;
            }

            ksort($normalized);

            return $normalized;
        }

        return $value;
    }

    /**
     * Validate VSTEP structure rules before import.
     *
     * @param  array<string, mixed>  $versionData
     *
     * @throws ValidationException
     */
    private function validateStructure(array $versionData): void
    {
        $sections = collect($versionData['listening_sections'] ?? []);
        $listeningItems = collect($versionData['listening_items'] ?? [])
            ->groupBy('section_index')
            ->mapWithKeys(fn ($items, $idx) => [$idx => $items]);

        $passages = collect($versionData['reading_passages'] ?? []);
        $readingItems = collect($versionData['reading_items'] ?? [])
            ->groupBy('passage_index')
            ->mapWithKeys(fn ($items, $idx) => [$idx => $items]);

        $writingTasks = collect($versionData['writing_tasks'] ?? []);
        $speakingParts = collect($versionData['speaking_parts'] ?? []);

        $errors = $this->validator->validateFixtureData(
            $sections,
            $listeningItems,
            $passages,
            $readingItems,
            $writingTasks,
            $speakingParts,
        );

        if ($errors) {
            throw ValidationException::withMessages(['exam_version' => $errors]);
        }
    }
}
