<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Question;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class QuestionService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        return Question::with('knowledgePoints')
            ->when($filters['skill'] ?? null, fn ($q, $v) => $q->where('skill', $v))
            ->when($filters['level'] ?? null, fn ($q, $v) => $q->where('level', $v))
            ->when($filters['part'] ?? null, fn ($q, $v) => $q->where('part', $v))
            ->when($filters['topic'] ?? null, fn ($q, $v) => $q->where('topic', $v))
            ->when($filters['search'] ?? null, fn ($q, $v) => $q->where('content', 'ilike', "%{$v}%"))
            ->orderByDesc('created_at')
            ->paginate();
    }

    public function create(array $data, ?string $userId): Question
    {
        return DB::transaction(function () use ($data, $userId) {
            $kpIds = Arr::pull($data, 'knowledge_point_ids', []);

            $question = Question::create([...$data, 'created_by' => $userId]);

            if ($kpIds) {
                $question->knowledgePoints()->sync($kpIds);
            }

            return $question->load('knowledgePoints');
        });
    }

    public function update(Question $question, array $data): Question
    {
        return DB::transaction(function () use ($question, $data) {
            $kpIds = Arr::pull($data, 'knowledge_point_ids');

            $question->update($data);

            if ($kpIds !== null) {
                $question->knowledgePoints()->sync($kpIds);
            }

            return $question->load('knowledgePoints');
        });
    }

    public function delete(Question $question): void
    {
        $question->delete();
    }
}
