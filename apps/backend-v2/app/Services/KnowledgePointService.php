<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KnowledgePoint;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class KnowledgePointService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        return KnowledgePoint::query()
            ->when($filters['category'] ?? null, fn ($q, $v) => $q->where('category', $v))
            ->when($filters['search'] ?? null, fn ($q, $v) => $q->where('name', 'ilike', "%{$v}%"))
            ->orderBy('name')
            ->paginate();
    }

    public function create(array $data): KnowledgePoint
    {
        return KnowledgePoint::create($data);
    }

    public function update(KnowledgePoint $knowledgePoint, array $data): KnowledgePoint
    {
        $knowledgePoint->update($data);

        return $knowledgePoint;
    }

    public function delete(KnowledgePoint $knowledgePoint): void
    {
        $knowledgePoint->delete();
    }

    /**
     * @return Collection<int, KnowledgePoint>
     */
    public function topics(array $filters = []): Collection
    {
        return KnowledgePoint::query()
            ->withCount('questions')
            ->when($filters['category'] ?? null, fn ($q, $v) => $q->where('category', $v))
            ->orderBy('name')
            ->get();
    }
}
