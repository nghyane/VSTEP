<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * One-time content seed from fixtures/content.json.
 *
 * Uses DB::table()->upsert() so it is safe to re-run:
 * - existing rows are updated in place
 * - new rows are inserted
 * - no rows are deleted
 *
 * Schema-agnostic: if columns are added/removed via migrations,
 * the JSON simply carries the old columns and the new ones get
 * their default values. No SQL to maintain.
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
    ];

    /** Primary key(s) per table — used as upsert conflict target. */
    private const UNIQUE_BY = [
        'vocab_topics' => ['id'],
        'vocab_topic_tasks' => ['topic_id', 'task'],
        'vocab_words' => ['id'],
        'vocab_exercises' => ['id'],
        'grammar_points' => ['id'],
        'grammar_point_levels' => ['grammar_point_id', 'level'],
        'grammar_point_tasks' => ['grammar_point_id', 'task'],
        'grammar_structures' => ['id'],
        'grammar_examples' => ['id'],
        'grammar_common_mistakes' => ['id'],
        'grammar_vstep_tips' => ['id'],
        'grammar_exercises' => ['id'],
        'exams' => ['id'],
        'exam_versions' => ['id'],
        'exam_version_listening_sections' => ['id'],
        'exam_version_listening_items' => ['id'],
        'exam_version_reading_passages' => ['id'],
        'exam_version_reading_items' => ['id'],
        'exam_version_writing_tasks' => ['id'],
        'exam_version_speaking_parts' => ['id'],
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

        DB::transaction(function () use ($data) {
            foreach (self::TABLES as $table) {
                $rows = $data[$table] ?? [];
                if (empty($rows)) {
                    continue;
                }

                // Decode JSON string columns back to arrays for Eloquent
                $rows = array_map([$this, 'decodeJsonColumns'], $rows);

                // Chunk to avoid hitting parameter limits
                foreach (array_chunk($rows, 100) as $chunk) {
                    DB::table($table)->upsert(
                        $chunk,
                        self::UNIQUE_BY[$table],
                    );
                }

                $this->command->line("  {$table}: ".count($rows));
            }
        });

        $this->command->info('Content seeded from fixtures/content.json');
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
