<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('grading_rubrics')
            ->where('skill', 'writing')
            ->orderBy('id')
            ->get()
            ->each(function (object $rubric): void {
                $criteria = json_decode((string) $rubric->criteria, true);
                if (! is_array($criteria)) {
                    return;
                }

                $changed = false;
                foreach ($criteria as &$criterion) {
                    if (! is_array($criterion) || ($criterion['key'] ?? null) !== 'task_fulfillment') {
                        continue;
                    }

                    $params = is_array($criterion['params'] ?? null) ? $criterion['params'] : [];
                    $defaults = [
                        'severe_minimum_words_task1' => 60,
                        'severe_minimum_words_task2' => 125,
                        'minimum_covered_points' => 1,
                    ];

                    foreach ($defaults as $key => $value) {
                        if (! array_key_exists($key, $params)) {
                            $params[$key] = $value;
                            $changed = true;
                        }
                    }

                    $criterion['params'] = $params;
                }
                unset($criterion);

                if (! $changed) {
                    return;
                }

                DB::table('grading_rubrics')
                    ->where('id', $rubric->id)
                    ->update(['criteria' => json_encode($criteria, JSON_THROW_ON_ERROR)]);
            });
    }

    public function down(): void
    {
        DB::table('grading_rubrics')
            ->where('skill', 'writing')
            ->orderBy('id')
            ->get()
            ->each(function (object $rubric): void {
                $criteria = json_decode((string) $rubric->criteria, true);
                if (! is_array($criteria)) {
                    return;
                }

                $changed = false;
                foreach ($criteria as &$criterion) {
                    if (! is_array($criterion) || ($criterion['key'] ?? null) !== 'task_fulfillment') {
                        continue;
                    }

                    foreach (['severe_minimum_words_task1', 'severe_minimum_words_task2', 'minimum_covered_points'] as $key) {
                        if (is_array($criterion['params'] ?? null) && array_key_exists($key, $criterion['params'])) {
                            unset($criterion['params'][$key]);
                            $changed = true;
                        }
                    }
                }
                unset($criterion);

                if (! $changed) {
                    return;
                }

                DB::table('grading_rubrics')
                    ->where('id', $rubric->id)
                    ->update(['criteria' => json_encode($criteria, JSON_THROW_ON_ERROR)]);
            });
    }
};
