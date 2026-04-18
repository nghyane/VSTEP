<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Practice\StartSessionRequest;
use App\Models\PracticeSession;
use App\Models\Profile;
use App\Services\PracticeSessionService;
use App\Services\SpeakingPracticeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SpeakingPracticeController extends Controller
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
            'id' => $d->id, 'slug' => $d->slug, 'title' => $d->title,
            'level' => $d->level, 'estimated_minutes' => $d->estimated_minutes,
        ])->values()]);
    }

    public function showDrill(string $id): JsonResponse
    {
        $drill = $this->speakingService->getDrillWithSentences($id);

        return response()->json(['data' => [
            'id' => $drill->id, 'slug' => $drill->slug, 'title' => $drill->title,
            'description' => $drill->description, 'level' => $drill->level,
            'estimated_minutes' => $drill->estimated_minutes,
            'sentences' => $drill->sentences->map(fn ($s) => [
                'id' => $s->id, 'text' => $s->text, 'translation' => $s->translation,
            ])->values(),
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
            $this->profile($request), $request->validated('exercise_id'),
        );

        return response()->json(['data' => [
            'session_id' => $session->id, 'started_at' => $session->started_at,
        ]], 201);
    }

    public function startVstepSession(StartSessionRequest $request): JsonResponse
    {
        $session = $this->speakingService->startVstepPracticeSession(
            $this->profile($request), $request->validated('exercise_id'),
        );

        return response()->json(['data' => [
            'session_id' => $session->id, 'started_at' => $session->started_at,
        ]], 201);
    }

    public function drillAttempt(Request $request, string $sessionId): JsonResponse
    {
        $request->validate([
            'sentence_id' => ['required', 'uuid'],
            'mode' => ['required', 'string', 'in:dictation,shadowing'],
            'user_text' => ['nullable', 'string'],
            'accuracy_percent' => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);
        /** @var PracticeSession $session */
        $session = PracticeSession::query()->findOrFail($sessionId);

        $attempt = $this->speakingService->logDrillAttempt(
            $this->profile($request), $session,
            $request->input('sentence_id'), $request->input('mode'),
            $request->input('user_text'), $request->integer('accuracy_percent'),
        );

        return response()->json(['data' => [
            'attempt_id' => $attempt->id, 'accuracy_percent' => $attempt->accuracy_percent,
        ]]);
    }

    public function submitVstep(Request $request, string $sessionId): JsonResponse
    {
        $request->validate([
            'audio_url' => ['required', 'string', 'max:500'],
            'duration_seconds' => ['required', 'integer', 'min:1'],
        ]);
        /** @var PracticeSession $session */
        $session = PracticeSession::query()->findOrFail($sessionId);

        $submission = $this->speakingService->submitVstepPractice(
            $this->profile($request), $session,
            $request->input('audio_url'), $request->integer('duration_seconds'),
        );

        return response()->json(['data' => [
            'submission_id' => $submission->id,
            'grading_status' => 'pending',
        ]]);
    }

    private function profile(Request $request): Profile
    {
        return $request->attributes->get('active_profile');
    }
}
