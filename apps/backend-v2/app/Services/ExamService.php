<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Exam;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ExamService
{
    public function list(array $filters = [], bool $adminView = false): LengthAwarePaginator
    {
        return Exam::query()
            ->when($filters['type'] ?? null, fn ($q, $v) => $q->where('type', $v))
            ->when($filters['level'] ?? null, fn ($q, $v) => $q->where('level', $v))
            ->when($filters['skill'] ?? null, fn ($q, $v) => $q->whereJsonContains('blueprint', [['skill' => $v]]))
            ->when($filters['search'] ?? null, fn ($q, $v) => $q->where('title', 'ilike', "%{$v}%"))
            ->when(! $adminView, fn ($q) => $q->active())
            ->orderByDesc('created_at')
            ->paginate();
    }

    public function create(array $data, string $userId): Exam
    {
        return Exam::create([...$data, 'created_by' => $userId]);
    }

    public function update(Exam $exam, array $data): Exam
    {
        $exam->update($data);

        return $exam;
    }

    public function delete(Exam $exam): void
    {
        $exam->delete();
    }
}
