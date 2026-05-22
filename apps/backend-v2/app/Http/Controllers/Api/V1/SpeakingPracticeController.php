<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\GradingJobStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Practice\DrillAttemptRequest;
use App\Http\Requests\Practice\StartSessionRequest;
use App\Http\Requests\Practice\SubmitVstepRequest;
use App\Http\Resources\DrillSessionHistoryResource;
use App\Http\Resources\SpeakingSubmissionHistoryResource;
use App\Models\PracticeSession;
use App\Services\PracticeSessionService;
use App\Services\SpeakingPracticeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class SpeakingPracticeController extends Controller
{
    public function __construct(
        private readonly SpeakingPracticeService $speakingService,
        private readonly PracticeSessionService $sessionService,
    ) {}

    public function listDrills(Request $request): JsonResponse
    {
        $level = $request->string('level')->toString() ?: null;
        $drills = $this->speakingService->listDrills($level);

        return response()->json(['data' => $drills->map(fn ($d) => [
            'id' => $d->id,
            'slug' => $d->slug,
            'title' => $d->title,
            'level' => $d->level,
            'segment_count' => $d->sentences_count ?? $d->sentences()->count(),
            'estimated_minutes' => $d->estimated_minutes,
        ])->values()]);
    }

    public function drillHistory(Request $request): AnonymousResourceCollection
    {
        return DrillSessionHistoryResource::collection(
            $this->speakingService->drillHistory($request->profile()),
        );
    }

    public function vstepHistory(Request $request): AnonymousResourceCollection
    {
        $part = $request->integer('part') ?: null;

        return SpeakingSubmissionHistoryResource::collection(
            $this->speakingService->vstepHistory($request->profile(), $part),
        );
    }

    public function showDrill(string $id): JsonResponse
    {
        $drill = $this->speakingService->getDrillWithSentences($id);

        return response()->json(['data' => [
            'id' => $drill->id,
            'slug' => $drill->slug,
            'title' => $drill->title,
            'level' => $drill->level,
            'audio_url' => $drill->audio_url ?? '',
            'segments' => $drill->sentences->values()->map(fn ($s) => [
                'id' => $s->id,
                'index' => (int) $s->display_order,
                'text' => $s->text,
                'ipa' => $s->ipa ?? '',
                'translation' => $s->translation ?? '',
                'word_count' => $s->word_count ?? str_word_count($s->text),
                'audio_start' => $s->audio_start !== null ? (float) $s->audio_start : 0.0,
                'audio_end' => $s->audio_end !== null ? (float) $s->audio_end : 0.0,
            ]),
        ]]);
    }

    public function listTasks(Request $request): JsonResponse
    {
        $part = $request->integer('part') ?: null;
        $tasks = $this->speakingService->listTasks($part);

        return response()->json(['data' => $tasks->map(fn ($t) => [
            'id' => $t->id, 'slug' => $t->slug, 'title' => $t->title,
            'part' => $t->part, 'task_type' => $t->task_type,
            'speaking_seconds' => $t->speaking_seconds,
        ])->values()]);
    }

    public function showTask(string $id): JsonResponse
    {
        $task = $this->speakingService->getTask($id);

        return response()->json(['data' => [
            'id' => $task->id, 'slug' => $task->slug, 'title' => $task->title,
            'part' => $task->part, 'task_type' => $task->task_type,
            'content' => $task->content, 'speaking_seconds' => $task->speaking_seconds,
        ]]);
    }

    public function startDrillSession(StartSessionRequest $request): JsonResponse
    {
        $session = $this->speakingService->startDrillSession(
            $request->profile(), $request->validated('exercise_id'),
        );

        return response()->json(['data' => [
            'session_id' => $session->id, 'started_at' => $session->started_at,
        ]], 201);
    }

    public function startVstepSession(StartSessionRequest $request): JsonResponse
    {
        $session = $this->speakingService->startVstepPracticeSession(
            $request->profile(), $request->validated('exercise_id'),
        );

        return response()->json(['data' => [
            'session_id' => $session->id, 'started_at' => $session->started_at,
        ]], 201);
    }

    public function drillAttempt(DrillAttemptRequest $request, PracticeSession $practiceSession): JsonResponse
    {
        $attempt = $this->speakingService->logDrillAttempt(
            $request->profile(), $practiceSession,
            $request->validated('sentence_id'), $request->validated('mode'),
            $request->validated('user_text'), (int) ($request->validated('accuracy_percent') ?? 0),
        );

        return response()->json(['data' => [
            'attempt_id' => $attempt->id, 'accuracy_percent' => $attempt->accuracy_percent,
        ]]);
    }

    public function submitVstep(SubmitVstepRequest $request, PracticeSession $practiceSession): JsonResponse
    {
        $submission = $this->speakingService->submitVstepPractice(
            $request->profile(), $practiceSession,
            $request->validated('audio_url'), (int) $request->validated('duration_seconds'),
        );

        return response()->json(['data' => [
            'submission_id' => $submission->id,
            'grading_status' => GradingJobStatus::Pending->value,
        ]]);
    }
}
