<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $this->updateWritingRubrics(function (array $criteria): array {
            return array_map(function (array $criterion): array {
                $key = (string) ($criterion['key'] ?? '');
                $params = (array) ($criterion['params'] ?? []);

                if ($key === 'task_fulfillment') {
                    $params['task_fulfillment_word_caps_task1'] = [
                        ['max_words' => 80, 'cap' => 4],
                        ['max_words' => 120, 'cap' => 6],
                    ];
                    $params['task_fulfillment_word_caps_task2'] = [
                        ['max_words' => 80, 'cap' => 4],
                        ['max_words' => 120, 'cap' => 6],
                        ['max_words' => 180, 'cap' => 8],
                        ['max_words' => 220, 'cap' => 9],
                    ];
                }

                if ($key === 'vocabulary') {
                    unset($params['cefr_band_caps']);
                    $params['model'] = [
                        'empty_score' => 2,
                        'feature_weights' => [
                            'lexical_range' => 0.45,
                            'sophistication' => 0.25,
                            'diversity' => 0.20,
                            'readability' => 0.10,
                        ],
                        'confidence' => [
                            'min_classified_tokens' => 30,
                            'range_baseline' => 4,
                        ],
                        'lexical_range_bands' => [
                            ['threshold' => 0.0, 'band' => 2],
                            ['threshold' => 2.0, 'band' => 6],
                            ['threshold' => 2.5, 'band' => 7],
                            ['threshold' => 3.0, 'band' => 8],
                            ['threshold' => 3.5, 'band' => 9],
                            ['threshold' => 4.0, 'band' => 10],
                        ],
                        'sophistication_bands' => [
                            ['threshold' => 0.0, 'band' => 2],
                            ['threshold' => 2.0, 'band' => 6],
                            ['threshold' => 4.0, 'band' => 7],
                            ['threshold' => 6.0, 'band' => 8],
                            ['threshold' => 8.0, 'band' => 9],
                        ],
                        'diversity_bands' => [
                            ['threshold' => 0.0, 'band' => 2],
                            ['threshold' => 0.45, 'band' => 5],
                            ['threshold' => 0.55, 'band' => 6],
                            ['threshold' => 0.65, 'band' => 7],
                            ['threshold' => 0.75, 'band' => 8],
                        ],
                        'readability_bands' => [
                            ['threshold' => 0.0, 'band' => 2],
                            ['threshold' => 8.0, 'band' => 6],
                            ['threshold' => 10.0, 'band' => 7],
                            ['threshold' => 12.0, 'band' => 8],
                        ],
                        'control' => [
                            'spelling_penalty_per_error' => 0.25,
                            'max_spelling_penalty' => 1.5,
                        ],
                    ];
                }

                $criterion['params'] = $params;

                return $criterion;
            }, $criteria);
        });
    }

    public function down(): void
    {
        $this->updateWritingRubrics(function (array $criteria): array {
            return array_map(function (array $criterion): array {
                $key = (string) ($criterion['key'] ?? '');
                $params = (array) ($criterion['params'] ?? []);

                if ($key === 'task_fulfillment') {
                    unset($params['task_fulfillment_word_caps_task1'], $params['task_fulfillment_word_caps_task2']);
                }

                if ($key === 'vocabulary') {
                    unset($params['model']);
                }

                $criterion['params'] = $params;

                return $criterion;
            }, $criteria);
        });
    }

    /** @param callable(array<int,array<string,mixed>>): array<int,array<string,mixed>> $callback */
    private function updateWritingRubrics(callable $callback): void
    {
        DB::table('grading_rubrics')
            ->where('skill', 'writing')
            ->orderBy('id')
            ->each(function (object $rubric) use ($callback): void {
                $criteria = json_decode((string) $rubric->criteria, true);
                if (! is_array($criteria)) {
                    return;
                }

                DB::table('grading_rubrics')
                    ->where('id', $rubric->id)
                    ->update(['criteria' => json_encode($callback($criteria), JSON_THROW_ON_ERROR)]);
            });
    }
};
