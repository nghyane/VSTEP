<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PracticeSession;
use App\Models\Profile;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Practice session lifecycle.
 *
 * Session flow:
 * 1. start(): create row với module + content_ref.
 * 2. complete(): set ended_at + duration_seconds and records activity.
 */
final class PracticeSessionService
{
    public function __construct(
        private readonly ProgressService $progressService,
    ) {}

    public function start(
        Profile $profile,
        string $module,
        Model $content,
    ): PracticeSession {
        return PracticeSession::create([
            'profile_id' => $profile->id,
            'module' => $module,
            'content_ref_type' => $this->refType($content),
            'content_ref_id' => $content->getKey(),
            'started_at' => now(),
        ]);
    }

    public function complete(PracticeSession $session): PracticeSession
    {
        if ($session->ended_at !== null) {
            return $session;
        }

        $endedAt = now();
        $duration = (int) $endedAt->diffInSeconds($session->started_at, absolute: true);

        $session->update([
            'ended_at' => $endedAt,
            'duration_seconds' => $duration,
        ]);

        $completed = $session->refresh();
        $this->progressService->recordPracticeCompletion($completed);

        return $completed;
    }

    private function refType(Model $content): string
    {
        return Str::snake(class_basename($content::class));
    }
}
