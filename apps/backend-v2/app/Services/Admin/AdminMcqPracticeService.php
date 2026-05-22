<?php

declare(strict_types=1);

namespace App\Services\Admin;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Generic CRUD service for "MCQ-style" practice modules:
 * - 1 parent table (exercise/passage) với is_published + slug
 * - 1 child table (questions) với MCQ format (options[], correct_index)
 *
 * Reused for: Listening, Reading. Writing/Speaking phức tạp hơn → service riêng.
 */
final class AdminMcqPracticeService
{
    /**
     * @param  class-string<Model>  $exerciseClass
     * @param  array<string,mixed>  $filters
     */
    public function listExercises(string $exerciseClass, array $filters): Builder
    {
        $query = $exerciseClass::query()->withCount('questions');

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function (Builder $q) use ($term) {
                $q->where('title', 'ilike', $term)->orWhere('slug', 'ilike', $term);
            });
        }

        if (array_key_exists('is_published', $filters) && $filters['is_published'] !== null) {
            $query->where('is_published', (bool) $filters['is_published']);
        }

        if (! empty($filters['part'])) {
            $query->where('part', (int) $filters['part']);
        }

        $sort = $filters['sort'] ?? 'created_at';
        $order = ($filters['order'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $allowed = ['title', 'part', 'created_at', 'updated_at'];
        if (! in_array($sort, $allowed, true)) {
            $sort = 'created_at';
        }

        return $query->orderBy($sort, $order);
    }

    /**
     * @param  class-string<Model>  $exerciseClass
     * @param  array<string,mixed>  $data
     */
    public function createExercise(string $exerciseClass, array $data): Model
    {
        if (! array_key_exists('is_published', $data)) {
            $data['is_published'] = false;
        }

        return $exerciseClass::create($data);
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function updateExercise(Model $exercise, array $data): Model
    {
        $exercise->fill($data)->save();

        return $exercise->fresh();
    }

    public function setPublished(Model $exercise, bool $value): Model
    {
        $exercise->update(['is_published' => $value]);

        return $exercise->fresh();
    }

    /**
     * @param  class-string<Model>  $questionClass
     * @param  array<string,mixed>  $data
     */
    public function createQuestion(string $questionClass, Model $exercise, array $data): Model
    {
        if (! array_key_exists('display_order', $data) || $data['display_order'] === null) {
            $data['display_order'] = (int) $questionClass::query()
                ->where('exercise_id', $exercise->id)
                ->max('display_order') + 1;
        }
        $data['exercise_id'] = $exercise->id;

        return $questionClass::create($data);
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function updateQuestion(Model $question, array $data): Model
    {
        $question->fill($data)->save();

        return $question->fresh();
    }

    /**
     * @param  class-string<Model>  $questionClass
     * @param  array<int,string>  $ids
     */
    public function reorderQuestions(string $questionClass, Model $exercise, array $ids): void
    {
        DB::transaction(function () use ($questionClass, $exercise, $ids) {
            foreach ($ids as $index => $id) {
                $questionClass::query()
                    ->where('exercise_id', $exercise->id)
                    ->where('id', $id)
                    ->update(['display_order' => $index]);
            }
        });
    }
}
