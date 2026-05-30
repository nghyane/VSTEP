<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\GradingJobStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Practice\StartSessionRequest;
use App\Http\Requests\Practice\SubmitWritingPracticeRequest;
use App\Http\Resources\WritingPromptDetailResource;
use App\Http\Resources\WritingPromptSummaryResource;
use App\Http\Resources\WritingSubmissionHistoryResource;
use App\Models\PracticeSession;
use App\Models\PracticeWritingSubmission;
use App\Services\PracticeGradingResultService;
use App\Services\PracticeSessionService;
use App\Services\WritingPracticeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

final class WritingPracticeController extends Controller
{
    public function __construct(
        private readonly WritingPracticeService $writingService,
        private readonly PracticeSessionService $sessionService,
        private readonly PracticeGradingResultService $gradingResultService,
    ) {}

    public function listPrompts(Request $request): JsonResponse
    {
        $part = $request->integer('part') ?: null;

        return response()->json(['data' => WritingPromptSummaryResource::collection(
            $this->writingService->listPrompts($part)
        )]);
    }

    public function history(Request $request): AnonymousResourceCollection
    {
        $part = $request->integer('part') ?: null;

        return WritingSubmissionHistoryResource::collection(
            $this->writingService->history($request->profile(), $part),
        );
    }

    public function showPrompt(string $id): JsonResponse
    {
        return response()->json(['data' => WritingPromptDetailResource::make(
            $this->writingService->getPromptWithChildren($id)
        )]);
    }

    public function result(Request $request, PracticeWritingSubmission $submission): JsonResponse
    {
        return response()->json(
            $this->gradingResultService->writing($request->profile(), $submission),
        );
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

    public function submit(SubmitWritingPracticeRequest $request, PracticeSession $practiceSession): JsonResponse
    {
        Gate::authorize('submit', $practiceSession);

        $result = $this->writingService->submit(
            $practiceSession, $request->validated('text'),
        );

        return response()->json(['data' => [
            'submission_id' => $result['submission']->id,
            'job_id' => $result['job_id'],
            'word_count' => $result['submission']->word_count,
            'submitted_at' => $result['submission']->submitted_at,
            'grading_status' => GradingJobStatus::Pending->value,
        ]]);
    }
}
