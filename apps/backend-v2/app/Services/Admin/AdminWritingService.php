<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\PracticeWritingPrompt;
use App\Models\PracticeWritingSampleMarker;
use Illuminate\Database\Eloquent\Builder;

final class AdminWritingService
{
    /**
     * @param  array<string,mixed>  $filters
     */
    public function list(array $filters): Builder
    {
        $query = PracticeWritingPrompt::query()->withCount('sampleMarkers');

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
    public function createPrompt(array $data): PracticeWritingPrompt
    {
        if (! array_key_exists('is_published', $data)) {
            $data['is_published'] = false;
        }

        return PracticeWritingPrompt::create($data);
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function updatePrompt(PracticeWritingPrompt $prompt, array $data): PracticeWritingPrompt
    {
        $prompt->fill($data)->save();

        return $prompt->fresh();
    }

    public function deletePrompt(PracticeWritingPrompt $prompt): void
    {
        $prompt->delete();
    }

    public function setPublished(PracticeWritingPrompt $prompt, bool $value): PracticeWritingPrompt
    {
        $prompt->forceFill(['is_published' => $value])->save();

        return $prompt->fresh();
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function createMarker(PracticeWritingPrompt $prompt, array $data): PracticeWritingSampleMarker
    {
        if (! array_key_exists('display_order', $data) || $data['display_order'] === null) {
            $data['display_order'] = (int) $prompt->sampleMarkers()->max('display_order') + 1;
        }
        $data['prompt_id'] = $prompt->id;

        return PracticeWritingSampleMarker::create($data);
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function updateMarker(PracticeWritingSampleMarker $marker, array $data): PracticeWritingSampleMarker
    {
        $marker->fill($data)->save();

        return $marker->fresh();
    }

    public function deleteMarker(PracticeWritingSampleMarker $marker): void
    {
        $marker->delete();
    }
}
