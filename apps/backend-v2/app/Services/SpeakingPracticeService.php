<?php

declare(strict_types=1);

namespace App\Services;

use App\Assessment\Services\AssessmentIntakeService;
use App\Models\PracticeSession;
use App\Models\PracticeSpeakingDrill;
use App\Models\PracticeSpeakingDrillAttempt;
use App\Models\PracticeSpeakingDrillSentence;
use App\Models\PracticeSpeakingSubmission;
use App\Models\PracticeSpeakingTask;
use App\Models\Profile;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class SpeakingPracticeService
{
    public function __construct(
        private readonly PracticeSessionService $sessionService,
        private readonly AssessmentIntakeService $assessments,
        private readonly AudioStorageService $audioStorage,
    ) {}

    /** @return Collection<int,PracticeSpeakingDrill> */
    public function listDrills(?string $level = null): Collection
    {
        $query = PracticeSpeakingDrill::query()
            ->where('is_published', true)
            ->withCount('sentences');
        if ($level !== null) {
            $query->where('level', $level);
        }

        return $query->orderBy('level')->orderBy('created_at')->orderBy('slug')->get();
    }

    public function getDrillWithSentences(string $id): PracticeSpeakingDrill
    {
        /** @var PracticeSpeakingDrill $drill */
        $drill = PracticeSpeakingDrill::query()
            ->with(['sentences' => fn ($q) => $q->orderBy('display_order')])
            ->findOrFail($id);

        return $drill;
    }

    /** @return Collection<int,PracticeSpeakingTask> */
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
        PracticeSession $session,
        string $sentenceId,
        string $mode,
        ?string $userText,
        ?int $accuracyPercent,
    ): PracticeSpeakingDrillAttempt {
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

    public function vstepHistory(Profile $profile, ?int $part = null): LengthAwarePaginator
    {
        return PracticeSpeakingSubmission::query()
            ->where('profile_id', $profile->id)
            ->where('task_ref_type', 'practice_speaking_task')
            ->with('assessmentAttempt.result')
            ->when($part !== null, fn ($q) => $q->whereHas(
                'speakingTask', fn ($q) => $q->where('part', $part),
            ))
            ->orderByDesc('submitted_at')
            ->paginate();
    }

    public function drillHistory(Profile $profile): LengthAwarePaginator
    {
        return PracticeSession::query()
            ->where('profile_id', $profile->id)
            ->where('module', 'speaking_drill')
            ->whereNotNull('ended_at')
            ->withCount('drillAttempts')
            ->orderByDesc('started_at')
            ->paginate();
    }

    public function submitVstepPractice(
        PracticeSession $session,
        string $audioKey,
        int $durationSeconds,
    ): PracticeSpeakingSubmission {
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

        return DB::transaction(function () use ($session, $audioKey, $durationSeconds) {
            $locked = PracticeSession::query()
                ->whereKey($session->id)
                ->lockForUpdate()
                ->first();

            if ($locked->ended_at !== null) {
                throw ValidationException::withMessages([
                    'session' => ['Session already submitted.'],
                ]);
            }

            $this->audioStorage->assertOwnedUploadedAudio(
                $locked->profile_id,
                $audioKey,
                'practice_speaking',
            );

            $submission = PracticeSpeakingSubmission::create([
                'session_id' => $locked->id,
                'profile_id' => $locked->profile_id,
                'task_ref_type' => 'practice_speaking_task',
                'task_ref_id' => $locked->content_ref_id,
                'audio_key' => $audioKey,
                'audio_url' => $this->audioStorage->publicUrl($audioKey),
                'duration_seconds' => $durationSeconds,
                'submitted_at' => now(),
            ]);

            $this->sessionService->complete($locked);
            $this->assessments->submitPracticeSpeaking($submission);

            return $submission;
        });
    }
}
