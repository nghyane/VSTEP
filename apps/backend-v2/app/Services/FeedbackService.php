<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ExerciseFeedback;
use App\Models\Profile;
use Illuminate\Database\Eloquent\Collection;

final class FeedbackService
{
    public function create(Profile $profile, array $data): ExerciseFeedback
    {
        return ExerciseFeedback::create([
            'profile_id' => $profile->id,
            ...$data,
        ]);
    }

    public function listForContent(string $contentType, string $contentId): Collection
    {
        return ExerciseFeedback::query()
            ->where('content_type', $contentType)
            ->where('content_id', $contentId)
            ->with('profile:id,nickname')
            ->latest()
            ->limit(50)
            ->get();
    }
}
