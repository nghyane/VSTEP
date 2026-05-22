<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\GrammarExercise;
use App\Models\GrammarPoint;
use App\Models\GrammarPointFunction;
use App\Models\GrammarPointLevel;
use App\Models\GrammarPointTask;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Admin CRUD orchestration cho Grammar module.
 * Point ↔ levels/tasks/functions (M-N) sync inline qua field tương ứng.
 * Children (structures, examples, mistakes, tips, exercises) endpoint riêng.
 */
final class AdminGrammarService
{
    /**
     * @param  array<string,mixed>  $filters
     */
    public function listPoints(array $filters): Builder
    {
        $query = GrammarPoint::query()
            ->with(['levels', 'tasks', 'functions'])
            ->withCount(['structures', 'examples', 'exercises']);

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function (Builder $q) use ($term) {
                $q->where('name', 'ilike', $term)
                    ->orWhere('slug', 'ilike', $term)
                    ->orWhere('vietnamese_name', 'ilike', $term);
            });
        }

        if (array_key_exists('is_published', $filters) && $filters['is_published'] !== null) {
            $query->where('is_published', (bool) $filters['is_published']);
        }

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        $sort = $filters['sort'] ?? 'display_order';
        $order = ($filters['order'] ?? 'asc') === 'desc' ? 'desc' : 'asc';
        $allowedSort = ['display_order', 'name', 'category', 'created_at', 'updated_at'];
        if (! in_array($sort, $allowedSort, true)) {
            $sort = 'display_order';
        }

        return $query->orderBy($sort, $order)->orderBy('name');
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function createPoint(array $data): GrammarPoint
    {
        return DB::transaction(function () use ($data) {
            $levels = $data['levels'] ?? null;
            $tasks = $data['tasks'] ?? null;
            $functions = $data['functions'] ?? null;
            unset($data['levels'], $data['tasks'], $data['functions']);

            if (! array_key_exists('display_order', $data) || $data['display_order'] === null) {
                $data['display_order'] = (int) GrammarPoint::query()->max('display_order') + 1;
            }
            if (! array_key_exists('is_published', $data)) {
                $data['is_published'] = false;
            }

            $point = GrammarPoint::create($data);

            if (is_array($levels)) {
                $this->syncJunction(GrammarPointLevel::class, $point->id, 'level', $levels);
            }
            if (is_array($tasks)) {
                $this->syncJunction(GrammarPointTask::class, $point->id, 'task', $tasks);
            }
            if (is_array($functions)) {
                $this->syncJunction(GrammarPointFunction::class, $point->id, 'function', $functions);
            }

            return $point->load(['levels', 'tasks', 'functions'])
                ->loadCount(['structures', 'examples', 'exercises']);
        });
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function updatePoint(GrammarPoint $point, array $data): GrammarPoint
    {
        return DB::transaction(function () use ($point, $data) {
            $levels = $data['levels'] ?? null;
            $tasks = $data['tasks'] ?? null;
            $functions = $data['functions'] ?? null;
            unset($data['levels'], $data['tasks'], $data['functions']);

            if (count($data) > 0) {
                $point->fill($data)->save();
            }

            if (is_array($levels)) {
                $this->syncJunction(GrammarPointLevel::class, $point->id, 'level', $levels);
            }
            if (is_array($tasks)) {
                $this->syncJunction(GrammarPointTask::class, $point->id, 'task', $tasks);
            }
            if (is_array($functions)) {
                $this->syncJunction(GrammarPointFunction::class, $point->id, 'function', $functions);
            }

            return $point->fresh()
                ->load(['levels', 'tasks', 'functions'])
                ->loadCount(['structures', 'examples', 'exercises']);
        });
    }

    public function deletePoint(GrammarPoint $point): void
    {
        $point->delete();
    }

    public function setPublished(GrammarPoint $point, bool $value): GrammarPoint
    {
        $point->update(['is_published' => $value]);

        return $point->fresh()
            ->load(['levels', 'tasks', 'functions'])
            ->loadCount(['structures', 'examples', 'exercises']);
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function createChild(string $modelClass, GrammarPoint $point, array $data, string $orderField = 'display_order'): Model
    {
        if (! array_key_exists($orderField, $data) || $data[$orderField] === null) {
            $data[$orderField] = (int) $modelClass::query()
                ->where('grammar_point_id', $point->id)
                ->max($orderField) + 1;
        }
        $data['grammar_point_id'] = $point->id;

        return $modelClass::create($data);
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function updateChild(Model $child, array $data): Model
    {
        $child->fill($data)->save();

        return $child->fresh();
    }

    public function deleteChild(Model $child): void
    {
        $child->delete();
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function createExercise(GrammarPoint $point, array $data): GrammarExercise
    {
        if (! array_key_exists('display_order', $data) || $data['display_order'] === null) {
            $data['display_order'] = (int) $point->exercises()->max('display_order') + 1;
        }
        $data['grammar_point_id'] = $point->id;
        $data['payload'] = $this->stripExercisePayload($data['kind'], $data['payload']);

        return GrammarExercise::create($data);
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function updateExercise(GrammarExercise $exercise, array $data): GrammarExercise
    {
        if (array_key_exists('payload', $data)) {
            $data['payload'] = $this->stripExercisePayload($exercise->kind, $data['payload']);
        }
        $exercise->fill($data)->save();

        return $exercise->fresh();
    }

    /**
     * @param  class-string<Model>  $modelClass
     * @param  array<int,string>  $ids
     */
    public function reorder(string $modelClass, GrammarPoint $point, array $ids): void
    {
        DB::transaction(function () use ($modelClass, $point, $ids) {
            foreach ($ids as $index => $id) {
                $modelClass::query()
                    ->where('grammar_point_id', $point->id)
                    ->where('id', $id)
                    ->update(['display_order' => $index]);
            }
        });
    }

    /**
     * Replace all rows in a junction table with given values.
     *
     * @param  class-string<Model>  $modelClass
     * @param  array<int,string>  $values
     */
    private function syncJunction(
        string $modelClass,
        string $pointId,
        string $valueField,
        array $values,
    ): void {
        $unique = array_values(array_unique($values));

        $modelClass::query()->where('grammar_point_id', $pointId)->delete();
        foreach ($unique as $value) {
            $modelClass::create([
                'grammar_point_id' => $pointId,
                $valueField => $value,
            ]);
        }
    }

    /**
     * @param  array<string,mixed>  $payload
     * @return array<string,mixed>
     */
    private function stripExercisePayload(string $kind, array $payload): array
    {
        $allowed = match ($kind) {
            'mcq' => ['prompt', 'options', 'correct_index'],
            'error_correction' => ['sentence', 'error_start', 'error_end', 'correction'],
            'fill_blank' => ['template', 'accepted_answers'],
            'rewrite' => ['instruction', 'original', 'accepted_answers'],
            default => array_keys($payload),
        };

        $result = [];
        foreach ($allowed as $key) {
            if (array_key_exists($key, $payload)) {
                $result[$key] = $payload[$key];
            }
        }

        return $result;
    }
}
