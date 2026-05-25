<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\Exam;
use Illuminate\Database\Eloquent\Builder;

final class AdminExamService
{
    /**
     * Build query for exam listing with filters.
     *
     * @param  array{q?: string, is_published?: string}  $filters
     */
    public function listExams(array $filters): Builder
    {
        $query = Exam::query()
            ->withCount('versions')
            ->with(['versions' => fn ($q) => $q->where('is_active', true)]);

        if (! empty($filters['q'])) {
            $search = $filters['q'];
            $query->where(function (Builder $q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                    ->orWhere('slug', 'ilike', "%{$search}%")
                    ->orWhere('source_school', 'ilike', "%{$search}%");
            });
        }

        if (isset($filters['is_published'])) {
            $query->where('is_published', $filters['is_published'] === '1');
        }

        return $query->orderByDesc('created_at');
    }

    public function createExam(array $data): Exam
    {
        return Exam::create($data);
    }

    public function updateExam(Exam $exam, array $data): Exam
    {
        $exam->fill($data)->save();

        return $exam->fresh()->loadCount('versions')
            ->load(['versions' => fn ($q) => $q->where('is_active', true)]);
    }

    public function deleteExam(Exam $exam): void
    {
        $exam->delete();
    }

    public function setPublished(Exam $exam, bool $published): Exam
    {
        $exam->is_published = $published;
        $exam->save();

        return $exam->fresh()->loadCount('versions')
            ->load(['versions' => fn ($q) => $q->where('is_active', true)]);
    }
}
