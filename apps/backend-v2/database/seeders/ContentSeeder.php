<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Services\ExamVersionValidator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Content seed from fixtures/content.json.
 * Truncates content tables then re-inserts — full replacement.
 * Safe to re-run. Schema-agnostic: new columns get their DB defaults.
 */
class ContentSeeder extends Seeder
{
    /** Tables in dependency order (parents before children). */
    private const TABLES = [
        'vocab_topics',
        'vocab_topic_tasks',
        'vocab_words',
        'vocab_exercises',
        'grammar_points',
        'grammar_point_levels',
        'grammar_point_tasks',
        'grammar_structures',
        'grammar_examples',
        'grammar_common_mistakes',
        'grammar_vstep_tips',
        'grammar_exercises',
        'exams',
        'exam_versions',
        'exam_version_listening_sections',
        'exam_version_listening_items',
        'exam_version_reading_passages',
        'exam_version_reading_items',
        'exam_version_writing_tasks',
        'exam_version_speaking_parts',
        'practice_listening_exercises',
        'practice_listening_questions',
        'practice_reading_exercises',
        'practice_reading_questions',
        'practice_writing_prompts',
        'practice_writing_sample_markers',
        'practice_speaking_drills',
        'practice_speaking_drill_sentences',
        'practice_speaking_tasks',
    ];

    public function run(): void
    {
        $path = database_path('fixtures/content.json');

        if (! file_exists($path)) {
            $this->command->error('fixtures/content.json not found');

            return;
        }

        /** @var array<string, list<array<string,mixed>>> $data */
        $data = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

        $this->validateExamFixtures($data);

        DB::transaction(function () use ($data) {
            foreach (array_reverse(self::TABLES) as $table) {
                DB::table($table)->truncate();
            }

            foreach (self::TABLES as $table) {
                $rows = $data[$table] ?? [];
                if (empty($rows)) {
                    continue;
                }

                $rows = array_map([$this, 'decodeJsonColumns'], $rows);

                foreach (array_chunk($rows, 100) as $chunk) {
                    DB::table($table)->insert($chunk);
                }

                $this->command->line("  {$table}: ".count($rows));
            }
        });

        $this->command->info('Content seeded from fixtures/content.json');
    }

    /**
     * Validate exam version fixtures against VSTEP format before DB insert.
     *
     * @param  array<string, list<array<string,mixed>>>  $data
     */
    private function validateExamFixtures(array $data): void
    {
        $validator = new ExamVersionValidator;

        $versions = $data['exam_versions'] ?? [];
        if (empty($versions)) {
            return;
        }

        // Index parent → version for grouping
        $sectionsByVersion = collect($data['exam_version_listening_sections'] ?? [])
            ->groupBy('exam_version_id');
        $passagesByVersion = collect($data['exam_version_reading_passages'] ?? [])
            ->groupBy('exam_version_id');
        $writingByVersion = collect($data['exam_version_writing_tasks'] ?? [])
            ->groupBy('exam_version_id');
        $speakingByVersion = collect($data['exam_version_speaking_parts'] ?? [])
            ->groupBy('exam_version_id');

        // Index items by their direct parent FK (not version)
        $itemsBySection = collect($data['exam_version_listening_items'] ?? [])
            ->groupBy('section_id');
        $itemsByPassage = collect($data['exam_version_reading_items'] ?? [])
            ->groupBy('passage_id');

        $errors = [];
        foreach ($versions as $version) {
            $vid = $version['id'];

            $versionErrors = $validator->validateFixtureData(
                collect($sectionsByVersion->get($vid, [])),
                $itemsBySection,
                collect($passagesByVersion->get($vid, [])),
                $itemsByPassage,
                collect($writingByVersion->get($vid, [])),
                collect($speakingByVersion->get($vid, [])),
            );

            if ($versionErrors) {
                $errors[] = "Exam version {$vid}: ".implode(' ', $versionErrors);
            }
        }

        if ($errors) {
            $this->command->error('Exam fixture validation failed:');
            foreach ($errors as $error) {
                $this->command->error("  - {$error}");
            }

            exit(1);
        }
    }

    /**
     * JSON columns are stored as strings in the dump.
     * Re-encode arrays/objects so DB driver handles them correctly.
     *
     * @param  array<string,mixed>  $row
     * @return array<string,mixed>
     */
    private function decodeJsonColumns(array $row): array
    {
        foreach ($row as $key => $value) {
            if (is_string($value) && str_starts_with(ltrim($value), '[') || is_string($value) && str_starts_with(ltrim($value), '{')) {
                $decoded = json_decode($value, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $row[$key] = json_encode($decoded, JSON_UNESCAPED_UNICODE);
                }
            }
        }

        return $row;
    }
}
