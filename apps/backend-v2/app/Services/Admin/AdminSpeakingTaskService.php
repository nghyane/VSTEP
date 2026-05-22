<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\PracticeSpeakingTask;
use Illuminate\Database\Eloquent\Builder;

class AdminSpeakingTaskService
{
    /**
     * @param  array<string,mixed>  $filters
     */
    public function list(array $filters): Builder
    {
        $query = PracticeSpeakingTask::query();

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function (Builder $b) use ($term) {
                $b->where('title', 'ilike', $term)->orWhere('slug', 'ilike', $term);
            });
        }

        if (array_key_exists('is_published', $filters) && $filters['is_published'] !== null) {
            $query->where('is_published', (bool) $filters['is_published']);
        }

        if (! empty($filters['part'])) {
            $query->where('part', (int) $filters['part']);
        }

        return $query->orderByDesc('created_at');
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function createTask(array $data): PracticeSpeakingTask
    {
        if (! array_key_exists('is_published', $data)) {
            $data['is_published'] = false;
        }

        return PracticeSpeakingTask::create($data);
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function updateTask(PracticeSpeakingTask $task, array $data): PracticeSpeakingTask
    {
        $task->fill($data)->save();

        return $task->fresh();
    }

    public function deleteTask(PracticeSpeakingTask $task): void
    {
        $task->delete();
    }

    public function setPublished(PracticeSpeakingTask $task, bool $value): PracticeSpeakingTask
    {
        $task->forceFill(['is_published' => $value])->save();

        return $task->fresh();
    }
}
