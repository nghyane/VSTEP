<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\GradingRubric;
use Illuminate\Database\Eloquent\Builder;

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
}
