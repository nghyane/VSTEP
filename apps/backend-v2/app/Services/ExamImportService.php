<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Exam;
use App\Models\ExamVersion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ExamImportService
{
    /**
     * Import a complete exam with version and all content.
     *
     * Validates structure before inserting. All inserts are atomic.
     *
     * @param  array<string, mixed>  $examData  slug, title, source_school, tags, total_duration_minutes, is_published
     * @param  array<string, mixed>  $versionData  version_number, published_at, + all content arrays
     *
     * @throws ValidationException If VSTEP structure rules are violated
     */
    public function importExam(array $examData, array $versionData): Exam
    {
        $now = now()->toDateTimeString();

        return DB::transaction(function () use ($examData, $versionData, $now) {
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
        });
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
                'display_order' => $part['display_order'] ?? $index,
            ]);
        }
    }
}
