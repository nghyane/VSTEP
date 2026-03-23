<?php

namespace App\Services;

use App\Models\Question;
use App\Support\CamelToSnake;
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
            $question = Question::create([
                'skill' => $data['skill'],
                'level' => $data['level'] ?? 'B1',
                'part' => $data['part'],
                'topic' => $data['topic'] ?? null,
                'content' => $data['content'],
                'answer_key' => $data['answerKey'] ?? null,
                'explanation' => $data['explanation'] ?? null,
                'is_active' => true,
                'created_by' => $userId,
            ]);

            if (!empty($data['knowledgePointIds'])) {
                $question->knowledgePoints()->sync($data['knowledgePointIds']);
            }

            return $question->load('knowledgePoints');
        });
    }

    public function update(Question $question, array $data): Question
    {
        return DB::transaction(function () use ($question, $data) {
            $fields = CamelToSnake::auto($data, [
                'skill', 'level', 'part', 'topic', 'content',
                'answerKey', 'explanation', 'isActive',
            ]);

            $question->update($fields);

            if (array_key_exists('knowledgePointIds', $data)) {
                $question->knowledgePoints()->sync($data['knowledgePointIds'] ?? []);
            }

            return $question->load('knowledgePoints');
        });
    }
}
