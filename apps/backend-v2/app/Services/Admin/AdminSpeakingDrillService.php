<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Models\PracticeSpeakingDrill;
use App\Models\PracticeSpeakingDrillSentence;
use Illuminate\Database\Eloquent\Builder;

final class AdminSpeakingDrillService
{
    /**
     * @param  array<string,mixed>  $filters
     */
    public function list(array $filters): Builder
    {
        $query = PracticeSpeakingDrill::query()->withCount('sentences');

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function (Builder $b) use ($term) {
                $b->where('title', 'ilike', $term)->orWhere('slug', 'ilike', $term);
            });
        }

        if (array_key_exists('is_published', $filters) && $filters['is_published'] !== null) {
            $query->where('is_published', (bool) $filters['is_published']);
        }

        if (! empty($filters['level'])) {
            $query->where('level', $filters['level']);
        }

        return $query->orderByDesc('created_at');
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function createDrill(array $data): PracticeSpeakingDrill
    {
        if (! array_key_exists('is_published', $data)) {
            $data['is_published'] = false;
        }

        return PracticeSpeakingDrill::create($data);
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function updateDrill(PracticeSpeakingDrill $drill, array $data): PracticeSpeakingDrill
    {
        $drill->fill($data)->save();

        return $drill->fresh();
    }

    public function deleteDrill(PracticeSpeakingDrill $drill): void
    {
        $drill->delete();
    }

    public function setPublished(PracticeSpeakingDrill $drill, bool $value): PracticeSpeakingDrill
    {
        $drill->forceFill(['is_published' => $value])->save();

        return $drill->fresh();
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function createSentence(PracticeSpeakingDrill $drill, array $data): PracticeSpeakingDrillSentence
    {
        if (! array_key_exists('display_order', $data) || $data['display_order'] === null) {
            $data['display_order'] = (int) $drill->sentences()->max('display_order') + 1;
        }
        $data['drill_id'] = $drill->id;

        return PracticeSpeakingDrillSentence::create($data);
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function updateSentence(PracticeSpeakingDrillSentence $sentence, array $data): PracticeSpeakingDrillSentence
    {
        $sentence->fill($data)->save();

        return $sentence->fresh();
    }

    public function deleteSentence(PracticeSpeakingDrillSentence $sentence): void
    {
        $sentence->delete();
    }
}
