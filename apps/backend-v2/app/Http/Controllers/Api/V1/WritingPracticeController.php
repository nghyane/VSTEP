<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Assessment\Enums\AssessmentJobStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Practice\StartSessionRequest;
use App\Http\Requests\Practice\SubmitWritingPracticeRequest;
use App\Http\Requests\Practice\WritingDiagnosticsRequest;
use App\Http\Resources\WritingPromptDetailResource;
use App\Http\Resources\WritingPromptSummaryResource;
use App\Http\Resources\WritingSubmissionHistoryResource;
use App\Models\PracticeSession;
use App\Models\PracticeWritingPrompt;
use App\Services\PracticeSessionService;
use App\Services\WritingPracticeService;
use App\Services\WritingRealtimeDiagnosticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

final class WritingPracticeController extends Controller
{
    public function __construct(
        private readonly WritingPracticeService $writingService,
        private readonly PracticeSessionService $sessionService,
        private readonly WritingRealtimeDiagnosticsService $diagnosticsService,
    ) {}

    public function listPrompts(Request $request): JsonResponse|AnonymousResourceCollection
    {
        $part = $request->integer('part') ?: null;

        if ($request->has('page') || $request->has('per_page')) {
            return WritingPromptSummaryResource::collection(
                $this->writingService->paginatePrompts(
                    $part,
                    min(max($request->integer('per_page', 12), 1), 48),
                    max($request->integer('page', 1), 1),
                    $request->profile(),
                ),
            );
        }

        return response()->json([
            'data' => WritingPromptSummaryResource::collection(
                $this->writingService->listPrompts($part, $request->profile())
            ),
        ]);
    }

    public function history(Request $request): AnonymousResourceCollection
    {
        $part = $request->integer('part') ?: null;

        return WritingSubmissionHistoryResource::collection(
            $this->writingService->history(
                $request->profile(),
                $part,
                min(max($request->integer('per_page', 10), 1), 48),
                max($request->integer('page', 1), 1),
            ),
        );
    }

    public function showPrompt(string $id): JsonResponse
    {
        return response()->json(['data' => WritingPromptDetailResource::make(
            $this->writingService->getPromptWithChildren($id)
        )]);
    }

    public function startSession(StartSessionRequest $request): JsonResponse
    {
        $session = $this->writingService->startSession(
            $request->profile(),
            $request->validated('exercise_id'),
        );

        return response()->json(['data' => [
            'session_id' => $session->id, 'started_at' => $session->started_at,
        ]], 201);
    }

    public function diagnostics(WritingDiagnosticsRequest $request): JsonResponse
    {
        $prompt = PracticeWritingPrompt::query()->findOrFail($request->validated('prompt_id'));

        return response()->json(['data' => $this->diagnosticsService->analyze(
            $prompt,
            (string) ($request->validated('text') ?? ''),
        )]);
    }

    public function submit(SubmitWritingPracticeRequest $request, PracticeSession $practiceSession): JsonResponse
    {
        Gate::authorize('submit', $practiceSession);

        $result = $this->writingService->submit(
            $practiceSession, $request->validated('text'),
        );

        return response()->json(['data' => [
            'submission_id' => $result['submission']->id,
            'attempt_id' => $result['attempt_id'],
            'job_id' => $result['job_id'],
            'word_count' => $result['submission']->word_count,
            'submitted_at' => $result['submission']->submitted_at,
            'grading_status' => AssessmentJobStatus::Pending->value,
        ]]);
    }
}
