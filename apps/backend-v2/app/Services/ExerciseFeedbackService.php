<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ExerciseFeedback;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

final class ExerciseFeedbackService
{
    /**
     * @param  array{content_type?: string|null, content_id?: string|null, rating?: int|null}  $filters
     * @return LengthAwarePaginator<int, ExerciseFeedback>
     */
    public function listForAdmin(array $filters, int $perPage): LengthAwarePaginator
    {
        return ExerciseFeedback::query()
            ->with([
                'profile:id,nickname',
                'listeningExercise:id,title,slug',
                'readingExercise:id,title,slug',
            ])
            ->when(
                $filters['content_type'] ?? null,
                fn (Builder $query, string $type) => $query->where('content_type', $type),
            )
            ->when(
                $filters['content_id'] ?? null,
                fn (Builder $query, string $id) => $query->where('content_id', $id),
            )
            ->when(
                $filters['rating'] ?? null,
                fn (Builder $query, int $rating) => $query->where('rating', $rating),
            )
            ->latest()
            ->paginate($perPage);
    }

    /** @param array{content_type: string, content_id: string, rating: int, comment?: string|null} $payload */
    public function store(string $profileId, array $payload): ExerciseFeedback
    {
        $comment = isset($payload['comment']) ? trim($payload['comment']) : null;

        return ExerciseFeedback::create([
            'profile_id' => $profileId,
            ...$payload,
            'comment' => $comment === '' ? null : $comment,
        ]);
    }
}
