<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PracticeShadowingProgress;
use App\Models\Profile;

final class ShadowingProgressService
{
    public function __construct(
        private readonly ProgressService $progressService,
    ) {}

    public function groupedByLesson(Profile $profile): array
    {
        $rows = PracticeShadowingProgress::query()
            ->where('profile_id', $profile->id)
            ->orderBy('lesson_id')
            ->orderBy('segment_index')
            ->get(['lesson_id', 'segment_index', 'accuracy_percent']);

        $grouped = [];
        foreach ($rows as $row) {
            $grouped[$row->lesson_id][] = [
                'segment_index' => $row->segment_index,
                'accuracy_percent' => $row->accuracy_percent,
            ];
        }

        return $grouped;
    }

    public function store(Profile $profile, array $data): PracticeShadowingProgress
    {
        $progress = PracticeShadowingProgress::query()->updateOrCreate(
            [
                'profile_id' => $profile->id,
                'lesson_id' => $data['lesson_id'],
                'segment_index' => $data['segment_index'],
            ],
            [
                'accuracy_percent' => $data['accuracy_percent'],
            ],
        );

        $this->progressService->recordSpeakingDrillActivity($profile->id);

        return $progress;
    }
}
