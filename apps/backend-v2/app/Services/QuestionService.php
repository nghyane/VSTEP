<?php

namespace App\Services;

use App\Models\Question;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class QuestionService
{
    public function list(array $params): LengthAwarePaginator
    {
        $query = Question::with('knowledgePoints');

        if ($skill = $params['skill'] ?? null) {
            $query->where('skill', $skill);
        }

        if ($level = $params['level'] ?? null) {
            $query->where('level', $level);
        }

        if ($part = $params['part'] ?? null) {
            $query->where('part', $part);
        }

        if ($topic = $params['topic'] ?? null) {
            $query->where('topic', $topic);
        }

        if ($search = $params['search'] ?? null) {
            $query->where('content', 'ilike', "%{$search}%");
        }

        return $query->orderByDesc('created_at')->paginate($params['limit'] ?? 20);
    }

    public function create(array $data, ?string $userId): Question
    {
        return DB::transaction(function () use ($data, $userId) {
            $kpIds = $data['knowledge_point_ids'] ?? null;
            unset($data['knowledge_point_ids']);

            $question = Question::create([
                ...$data,
                'level' => $data['level'] ?? 'B1',
                'is_active' => true,
                'created_by' => $userId,
            ]);

            if (!empty($kpIds)) {
                $question->knowledgePoints()->sync($kpIds);
            }

            return $question->load('knowledgePoints');
        });
    }

    public function update(Question $question, array $data): Question
    {
        return DB::transaction(function () use ($question, $data) {
            $kpIds = $data['knowledge_point_ids'] ?? null;
            unset($data['knowledge_point_ids']);

            $question->update($data);

            if ($kpIds !== null) {
                $question->knowledgePoints()->sync($kpIds);
            }

            return $question->load('knowledgePoints');
        });
    }
}
