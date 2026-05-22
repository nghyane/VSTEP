<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\VocabExercise;
use App\Models\VocabTopic;
use App\Models\VocabTopicTask;
use App\Models\VocabWord;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Admin CRUD orchestration for Vocab module.
 * Topic ↔ tasks (M-N) is synced inline qua field `tasks: string[]`.
 * Children (words, exercises) tách endpoint riêng.
 */
final class AdminVocabService
{
    /**
     * @param  array<string,mixed>  $filters
     */
    public function listTopics(array $filters): Builder
    {
        $query = VocabTopic::query()
            ->with('tasks')
            ->withCount(['words', 'exercises']);

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function (Builder $q) use ($term) {
                $q->where('name', 'ilike', $term)
                    ->orWhere('slug', 'ilike', $term);
            });
        }

        if (array_key_exists('is_published', $filters) && $filters['is_published'] !== null) {
            $query->where('is_published', (bool) $filters['is_published']);
        }

        if (! empty($filters['level'])) {
            $query->where('level', $filters['level']);
        }

        $sort = $filters['sort'] ?? 'display_order';
        $order = ($filters['order'] ?? 'asc') === 'desc' ? 'desc' : 'asc';
        $allowedSort = ['display_order', 'name', 'level', 'created_at', 'updated_at'];
        if (! in_array($sort, $allowedSort, true)) {
            $sort = 'display_order';
        }

        return $query->orderBy($sort, $order)->orderBy('name');
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function createTopic(array $data): VocabTopic
    {
        return DB::transaction(function () use ($data) {
            $tasks = $data['tasks'] ?? null;
            unset($data['tasks']);

            if (! array_key_exists('display_order', $data) || $data['display_order'] === null) {
                $data['display_order'] = (int) VocabTopic::query()->max('display_order') + 1;
            }
            if (! array_key_exists('is_published', $data)) {
                $data['is_published'] = false;
            }

            $topic = VocabTopic::create($data);

            if (is_array($tasks)) {
                $this->syncTasks($topic, $tasks);
            }

            return $topic->load('tasks')->loadCount(['words', 'exercises']);
        });
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function updateTopic(VocabTopic $topic, array $data): VocabTopic
    {
        return DB::transaction(function () use ($topic, $data) {
            $tasks = $data['tasks'] ?? null;
            unset($data['tasks']);

            if (count($data) > 0) {
                $topic->fill($data)->save();
            }

            if (is_array($tasks)) {
                $this->syncTasks($topic, $tasks);
            }

            return $topic->fresh()->load('tasks')->loadCount(['words', 'exercises']);
        });
    }

    public function deleteTopic(VocabTopic $topic): void
    {
        $topic->delete();
    }

    public function setPublished(VocabTopic $topic, bool $value): VocabTopic
    {
        $topic->update(['is_published' => $value]);

        return $topic->fresh()->load('tasks')->loadCount(['words', 'exercises']);
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function createWord(VocabTopic $topic, array $data): VocabWord
    {
        if (! array_key_exists('display_order', $data) || $data['display_order'] === null) {
            $data['display_order'] = (int) $topic->words()->max('display_order') + 1;
        }
        $data['topic_id'] = $topic->id;

        return VocabWord::create($data);
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function updateWord(VocabWord $word, array $data): VocabWord
    {
        $word->fill($data)->save();

        return $word->fresh();
    }

    public function deleteWord(VocabWord $word): void
    {
        $word->delete();
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function createExercise(VocabTopic $topic, array $data): VocabExercise
    {
        if (! array_key_exists('display_order', $data) || $data['display_order'] === null) {
            $data['display_order'] = (int) $topic->exercises()->max('display_order') + 1;
        }
        $data['topic_id'] = $topic->id;
        $data['payload'] = $this->stripPayloadKeys($data['kind'], $data['payload']);

        return VocabExercise::create($data);
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function updateExercise(VocabExercise $exercise, array $data): VocabExercise
    {
        if (array_key_exists('payload', $data)) {
            $data['payload'] = $this->stripPayloadKeys($exercise->kind, $data['payload']);
        }
        $exercise->fill($data)->save();

        return $exercise->fresh();
    }

    public function deleteExercise(VocabExercise $exercise): void
    {
        $exercise->delete();
    }

    /**
     * @param  array<int,string>  $ids
     */
    public function reorderWords(VocabTopic $topic, array $ids): void
    {
        DB::transaction(function () use ($topic, $ids) {
            foreach ($ids as $index => $id) {
                VocabWord::query()
                    ->where('topic_id', $topic->id)
                    ->where('id', $id)
                    ->update(['display_order' => $index]);
            }
        });
    }

    /**
     * @param  array<int,string>  $ids
     */
    public function reorderExercises(VocabTopic $topic, array $ids): void
    {
        DB::transaction(function () use ($topic, $ids) {
            foreach ($ids as $index => $id) {
                VocabExercise::query()
                    ->where('topic_id', $topic->id)
                    ->where('id', $id)
                    ->update(['display_order' => $index]);
            }
        });
    }

    /**
     * @param  array<int,string>  $tasks
     */
    private function syncTasks(VocabTopic $topic, array $tasks): void
    {
        $unique = array_values(array_unique($tasks));

        VocabTopicTask::query()->where('topic_id', $topic->id)->delete();
        foreach ($unique as $task) {
            VocabTopicTask::create(['topic_id' => $topic->id, 'task' => $task]);
        }
    }

    /**
     * Loại bỏ key thừa khỏi payload theo `kind` để tránh rác JSON.
     * Giữ thứ tự theo schema (allowed list).
     *
     * @param  array<string,mixed>  $payload
     * @return array<string,mixed>
     */
    private function stripPayloadKeys(string $kind, array $payload): array
    {
        $allowed = match ($kind) {
            'mcq' => ['prompt', 'options', 'correct_index'],
            'fill_blank' => ['sentence', 'accepted_answers'],
            'word_form' => ['instruction', 'sentence', 'root_word', 'accepted_answers'],
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
