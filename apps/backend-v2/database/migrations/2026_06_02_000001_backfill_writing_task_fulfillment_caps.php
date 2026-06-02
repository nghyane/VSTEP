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
                    $defaultShortCaps = [
                        ['max_words' => 10, 'cap' => 1],
                        ['max_words' => 30, 'cap' => 2],
                    ];

                    if (! array_key_exists('short_response_caps', $params)) {
                        $params['short_response_caps'] = $params['short_essay_caps'] ?? $defaultShortCaps;
                        $changed = true;
                    }

                    if (! array_key_exists('short_essay_caps', $params)) {
                        $params['short_essay_caps'] = $params['short_response_caps'];
                        $changed = true;
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

                    if (is_array($criterion['params'] ?? null) && array_key_exists('short_essay_caps', $criterion['params'])) {
                        unset($criterion['params']['short_essay_caps']);
                        $changed = true;
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
