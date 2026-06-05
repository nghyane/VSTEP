<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\AssessmentResult;
use App\Models\GradingRubric;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Read-only service cho admin xem grading rubrics.
 *
 * Rubric là reference data (Thông tư 23) — không cho phép CRUD từ admin UI
 * vì ảnh hưởng trực tiếp đến pipeline chấm điểm AI.
 */
final class AdminGradingRubricService
{
    private const ALLOWED_SORT = ['skill', 'version', 'created_at', 'name'];

    /**
     * @param  array<string,mixed>  $filters
     */
    public function listRubrics(array $filters): Builder
    {
        $query = GradingRubric::query()->with('activePolicy');

        if (! empty($filters['skill'])) {
            $query->where('skill', $filters['skill']);
        }

        if (array_key_exists('is_active', $filters) && $filters['is_active'] !== null) {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        $sort = $filters['sort'] ?? 'created_at';
        if (! in_array($sort, self::ALLOWED_SORT, true)) {
            $sort = 'created_at';
        }
        $order = ($filters['order'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sort, $order);
    }

    public function showRubric(string $id): GradingRubric
    {
        return GradingRubric::query()->with('policies')->findOrFail($id);
    }

    public function cloneRubric(string $id): GradingRubric
    {
        return DB::transaction(function () use ($id): GradingRubric {
            $source = GradingRubric::query()->lockForUpdate()->findOrFail($id);
            $versions = GradingRubric::query()
                ->where('skill', $source->skill)
                ->lockForUpdate()
                ->pluck('version');
            $nextVersion = ((int) $versions->max()) + 1;

            return GradingRubric::query()->create([
                'skill' => $source->skill,
                'version' => $nextVersion,
                'name' => $this->draftName($source->name, $nextVersion),
                'source_reference' => $source->source_reference,
                'criteria' => $source->criteria,
                'scoring_formula' => $source->scoring_formula,
                'is_active' => false,
                'effective_from' => now()->toDateString(),
            ])->refresh();
        });
    }

    /** @param array<string,mixed> $data */
    public function updateDraft(string $id, array $data): GradingRubric
    {
        return DB::transaction(function () use ($id, $data): GradingRubric {
            $rubric = GradingRubric::query()->lockForUpdate()->findOrFail($id);
            $this->ensureDraft($rubric);

            $updates = [];
            if (array_key_exists('name', $data)) {
                $updates['name'] = $data['name'];
            }
            if (array_key_exists('effective_from', $data)) {
                $updates['effective_from'] = $data['effective_from'];
            }
            if (isset($data['policy']) && is_array($data['policy'])) {
                if ($rubric->skill !== 'writing') {
                    throw ValidationException::withMessages([
                        'policy' => ['Hiện chỉ hỗ trợ chỉnh policy bằng form cho rubric Writing.'],
                    ]);
                }

                $updates['criteria'] = $this->updatedWritingCriteria($rubric->criteria, $data['policy']);
            }

            if ($updates !== []) {
                $rubric->update($updates);
            }

            return $rubric->refresh();
        });
    }

    public function activateDraft(string $id): GradingRubric
    {
        return DB::transaction(function () use ($id): GradingRubric {
            $rubric = GradingRubric::query()->lockForUpdate()->findOrFail($id);
            $this->ensureDraft($rubric);
            $this->validateWritingPolicy($rubric->criteria);

            GradingRubric::query()
                ->where('skill', $rubric->skill)
                ->where('is_active', true)
                ->update(['is_active' => false]);

            $rubric->update(['is_active' => true]);

            return $rubric->refresh();
        });
    }

    private function draftName(string $sourceName, int $version): string
    {
        $name = preg_replace('/\bv\d+\b/i', "v{$version}", $sourceName, 1, $count);

        return $count > 0 && is_string($name) ? $name : "{$sourceName} v{$version}";
    }

    private function ensureDraft(GradingRubric $rubric): void
    {
        if ($rubric->is_active) {
            throw ValidationException::withMessages([
                'rubric' => ['Rubric đang active nên không thể sửa trực tiếp. Hãy clone version mới trước.'],
            ]);
        }

        if (AssessmentResult::query()->where('rubric_id', $rubric->id)->exists()) {
            throw ValidationException::withMessages([
                'rubric' => ['Rubric đã có kết quả lịch sử nên không thể sửa. Hãy clone version mới trước.'],
            ]);
        }
    }

    /** @param list<array<string,mixed>> $criteria @param array<string,mixed> $policy @return list<array<string,mixed>> */
    private function updatedWritingCriteria(array $criteria, array $policy): array
    {
        $existingParams = [];
        foreach ($criteria as $criterion) {
            if (is_array($criterion) && ($criterion['key'] ?? null) === 'task_fulfillment') {
                $existingParams = is_array($criterion['params'] ?? null) ? $criterion['params'] : [];
                break;
            }
        }

        $wordMinTask1 = (int) ($policy['word_minimum_task1'] ?? $existingParams['word_minimum_task1'] ?? 120);
        $wordMinTask2 = (int) ($policy['word_minimum_task2'] ?? $existingParams['word_minimum_task2'] ?? 250);
        $coverage = (int) ($policy['minimum_covered_points'] ?? $existingParams['minimum_covered_points'] ?? 1);
        $severity = (string) ($policy['severity'] ?? $existingParams['severity'] ?? 'standard');

        $derived = ScoringPresetService::derive($severity, $wordMinTask1, $wordMinTask2, $coverage);

        foreach ($criteria as &$criterion) {
            if (! is_array($criterion) || ($criterion['key'] ?? null) !== 'task_fulfillment') {
                continue;
            }

            $criterion['params'] = array_merge(
                is_array($criterion['params'] ?? null) ? $criterion['params'] : [],
                $derived,
            );
        }
        unset($criterion);

        $this->validateWritingPolicy($criteria);

        return array_values($criteria);
    }

    /** @param list<array<string,mixed>> $criteria */
    private function validateWritingPolicy(array $criteria): void
    {
        $rubric = new GradingRubric(['criteria' => $criteria]);
        $params = $rubric->taskFulfillmentParams();

        if ($params->severeMinimumWordsTask1 >= $params->wordMinimumTask1) {
            throw ValidationException::withMessages([
                'policy.assessment_gates.severe_minimum_words_task1' => ['Ngưỡng không chấm Task 1 phải nhỏ hơn số từ yêu cầu chuẩn.'],
            ]);
        }

        if ($params->severeMinimumWordsTask2 >= $params->wordMinimumTask2) {
            throw ValidationException::withMessages([
                'policy.assessment_gates.severe_minimum_words_task2' => ['Ngưỡng không chấm Task 2 phải nhỏ hơn số từ yêu cầu chuẩn.'],
            ]);
        }

        $this->validateCaps($params->shortResponseCaps, 'policy.word_rules.short_response_caps');
        $this->validateCaps($params->taskFulfillmentWordCaps, 'policy.word_rules.task_fulfillment_word_caps');
    }

    /** @param list<array{max_words:int,cap:float}> $caps */
    private function validateCaps(array $caps, string $field): void
    {
        $last = 0;
        foreach ($caps as $index => $cap) {
            $maxWords = (int) $cap['max_words'];
            if ($maxWords <= $last) {
                throw ValidationException::withMessages([
                    $field => ["Các dòng giới hạn điểm phải sắp xếp tăng dần theo số từ tại dòng {$index}."],
                ]);
            }

            $last = $maxWords;
        }
    }
}
