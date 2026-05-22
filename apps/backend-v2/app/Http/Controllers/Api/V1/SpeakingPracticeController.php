<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\GradingJobStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Practice\DrillAttemptRequest;
use App\Http\Requests\Practice\StartSessionRequest;
use App\Http\Requests\Practice\SubmitVstepRequest;
use App\Http\Resources\DrillDetailResource;
use App\Http\Resources\DrillSessionHistoryResource;
use App\Http\Resources\DrillSummaryResource;
use App\Http\Resources\SpeakingSubmissionHistoryResource;
use App\Http\Resources\SpeakingTaskDetailResource;
use App\Http\Resources\SpeakingTaskSummaryResource;
use App\Models\PracticeSession;
use App\Services\PracticeSessionService;
use App\Services\SpeakingPracticeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

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

        return response()->json(['data' => DrillSummaryResource::collection($drills)]);
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

        return response()->json(['data' => DrillDetailResource::make($drill)]);
    }

    public function listTasks(Request $request): JsonResponse
    {
        $part = $request->integer('part') ?: null;
        $tasks = $this->speakingService->listTasks($part);

        return response()->json(['data' => SpeakingTaskSummaryResource::collection($tasks)]);
    }

    public function showTask(string $id): JsonResponse
    {
        $task = $this->speakingService->getTask($id);

        return response()->json(['data' => SpeakingTaskDetailResource::make($task)]);
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
        Gate::authorize('update', $practiceSession);
        $attempt = $this->speakingService->logDrillAttempt(
            $practiceSession,
            $request->validated('sentence_id'), $request->validated('mode'),
            $request->validated('user_text'), (int) ($request->validated('accuracy_percent') ?? 0),
        );

        return response()->json(['data' => [
            'attempt_id' => $attempt->id, 'accuracy_percent' => $attempt->accuracy_percent,
        ]]);
    }

    public function submitVstep(SubmitVstepRequest $request, PracticeSession $practiceSession): JsonResponse
    {
        Gate::authorize('submit', $practiceSession);
        $submission = $this->speakingService->submitVstepPractice(
            $practiceSession,
            $request->validated('audio_url'), (int) $request->validated('duration_seconds'),
        );

        return response()->json(['data' => [
            'submission_id' => $submission->id,
            'grading_status' => GradingJobStatus::Pending->value,
        ]]);
    }
}
