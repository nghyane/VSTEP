<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PracticeSession;
use App\Models\PracticeSpeakingDrill;
use App\Models\PracticeSpeakingDrillAttempt;
use App\Models\PracticeSpeakingDrillSentence;
use App\Models\PracticeSpeakingSubmission;
use App\Models\PracticeSpeakingTask;
use App\Models\Profile;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

/**
 * 2 product lines:
 * - Drill (dictation/shadowing): per-sentence accuracy, KHÔNG grading job
 * - VSTEP task: audio submission, sẽ grading AI ở Slice 8
 *
 * Module values: 'speaking_drill', 'speaking_vstep_practice'.
 */
class SpeakingPracticeService
{
    public function __construct(
        private readonly PracticeSessionService $sessionService,
        private readonly GradingService $gradingService,
    ) {}

    /**
     * @return Collection<int,PracticeSpeakingDrill>
     */
    public function listDrills(?string $level = null): Collection
    {
        $query = PracticeSpeakingDrill::query()->where('is_published', true);
        if ($level !== null) {
            $query->where('level', $level);
        }

        return $query->orderBy('level')->orderBy('created_at')->get();
    }

    public function getDrillWithSentences(string $id): PracticeSpeakingDrill
    {
        /** @var PracticeSpeakingDrill $drill */
        $drill = PracticeSpeakingDrill::query()
            ->with(['sentences' => fn ($q) => $q->orderBy('display_order')])
            ->findOrFail($id);

        return $drill;
    }

    /**
     * @return Collection<int,PracticeSpeakingTask>
     */
    public function listTasks(?int $part = null): Collection
    {
        $query = PracticeSpeakingTask::query()->where('is_published', true);
        if ($part !== null) {
            $query->where('part', $part);
        }

        return $query->orderBy('part')->get();
    }

    public function getTask(string $id): PracticeSpeakingTask
    {
        /** @var PracticeSpeakingTask $task */
        $task = PracticeSpeakingTask::query()->findOrFail($id);

        return $task;
    }

    public function startDrillSession(Profile $profile, string $drillId): PracticeSession
    {
        /** @var PracticeSpeakingDrill $drill */
        $drill = PracticeSpeakingDrill::query()->findOrFail($drillId);

        return $this->sessionService->start($profile, 'speaking_drill', $drill);
    }

    public function startVstepPracticeSession(Profile $profile, string $taskId): PracticeSession
    {
        /** @var PracticeSpeakingTask $task */
        $task = PracticeSpeakingTask::query()->findOrFail($taskId);

        return $this->sessionService->start($profile, 'speaking_vstep_practice', $task);
    }

    public function logDrillAttempt(
        Profile $profile,
        PracticeSession $session,
        string $sentenceId,
        string $mode,
        ?string $userText,
        ?int $accuracyPercent,
    ): PracticeSpeakingDrillAttempt {
        if ($session->profile_id !== $profile->id) {
            abort(403, 'Session does not belong to active profile.');
        }
        if ($session->module !== 'speaking_drill') {
            throw ValidationException::withMessages([
                'session' => ['Session is not a drill session.'],
            ]);
        }

        /** @var PracticeSpeakingDrillSentence $sentence */
        $sentence = PracticeSpeakingDrillSentence::query()->findOrFail($sentenceId);
        if ($sentence->drill_id !== $session->content_ref_id) {
            throw ValidationException::withMessages([
                'sentence_id' => ['Sentence does not belong to session drill.'],
            ]);
        }

        return PracticeSpeakingDrillAttempt::create([
            'session_id' => $session->id,
            'sentence_id' => $sentenceId,
            'mode' => $mode,
            'user_text' => $userText,
            'accuracy_percent' => $accuracyPercent,
            'attempted_at' => now(),
        ]);
    }

    public function submitVstepPractice(
        Profile $profile,
        PracticeSession $session,
        string $audioUrl,
        int $durationSeconds,
    ): PracticeSpeakingSubmission {
        if ($session->profile_id !== $profile->id) {
            abort(403, 'Session does not belong to active profile.');
        }
        if ($session->module !== 'speaking_vstep_practice') {
            throw ValidationException::withMessages([
                'session' => ['Session is not a VSTEP practice session.'],
            ]);
        }
        if ($session->ended_at !== null) {
            throw ValidationException::withMessages([
                'session' => ['Session already submitted.'],
            ]);
        }

        $submission = PracticeSpeakingSubmission::create([
            'session_id' => $session->id,
            'profile_id' => $profile->id,
            'task_ref_type' => 'practice_speaking_task',
            'task_ref_id' => $session->content_ref_id,
            'audio_url' => $audioUrl,
            'duration_seconds' => $durationSeconds,
            'submitted_at' => now(),
        ]);

        $this->sessionService->complete($session);

        $this->gradingService->enqueueSpeakingGrading('practice_speaking', $submission->id);

        return $submission;
    }
}
