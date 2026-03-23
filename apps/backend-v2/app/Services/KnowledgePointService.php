<?php

namespace App\Services;

use App\Models\KnowledgePoint;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class KnowledgePointService
{
    public function list(array $params): LengthAwarePaginator
    {
        $query = KnowledgePoint::query();

        if ($category = $params['category'] ?? null) {
            $query->where('category', $category);
        }

        if ($search = $params['search'] ?? null) {
            $query->where('name', 'ilike', "%{$search}%");
        }

        return $query->orderBy('name')->paginate($params['limit'] ?? 20);
    }

    public function create(array $data): KnowledgePoint
    {
        return KnowledgePoint::create($data);
    }

    public function topics(array $params): array
    {
        $query = KnowledgePoint::query()
            ->select('knowledge_points.id', 'knowledge_points.name')
            ->withCount('questions');

        if ($category = $params['category'] ?? null) {
            $query->where('category', $category);
        }

        return $query->orderBy('name')->get()->map(fn ($kp) => [
            'id' => $kp->id,
            'name' => $kp->name,
            'question_count' => $kp->questions_count,
        ])->all();
    }
}
