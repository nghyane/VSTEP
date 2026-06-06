<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Practice\StartSessionRequest;
use App\Http\Requests\Practice\SubmitMcqSessionRequest;
use App\Http\Resources\PracticeListeningExerciseResource;
use App\Http\Resources\PracticeListeningExerciseSummaryResource;
use App\Http\Resources\PracticeMcqQuestionResource;
use App\Http\Resources\PracticeReadingExerciseResource;
use App\Http\Resources\PracticeSessionResource;
use App\Models\PracticeSession;
use App\Services\McqSkillService;
use App\Services\PracticeSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

/**
 * Unified controller cho listening + reading drill practice.
 * Skill lấy từ URL prefix: /practice/{skill}/... với skill ∈ (listening, reading).
 */
final class McqPracticeController extends Controller
{
    public function __construct(
        private readonly McqSkillService $mcqService,
        private readonly PracticeSessionService $sessionService,
    ) {}

    public function listExercises(Request $request, string $skill): AnonymousResourceCollection
    {
        $this->assertSkill($skill);
        $part = $request->integer('part') ?: null;
        $exercises = $request->has('page') || $request->has('per_page')
            ? $this->mcqService->paginateExercises(
                $skill,
                $part,
                min(max($request->integer('per_page', 12), 1), 48),
                max($request->integer('page', 1), 1),
            )
            : $this->mcqService->listExercises($skill, $part);

        return match ($skill) {
            'listening' => PracticeListeningExerciseSummaryResource::collection($exercises),
            'reading' => PracticeReadingExerciseResource::collection($exercises),
        };
    }

    public function showExercise(Request $request, string $skill, string $id): JsonResponse
    {
        $this->assertSkill($skill);
        $data = $this->mcqService->getExercise($skill, $id);

        $exerciseResource = match ($skill) {
            'listening' => (new PracticeListeningExerciseResource($data['exercise']))->resolve($request),
            'reading' => (new PracticeReadingExerciseResource($data['exercise']))->resolve($request),
        };

        $questions = $data['questions']->map(
            fn ($q) => (new PracticeMcqQuestionResource($q, showAnswer: false))->resolve($request),
        )->values();

        return response()->json(['data' => [
            'exercise' => $exerciseResource,
            'questions' => $questions,
        ]]);
    }

    public function startSession(StartSessionRequest $request, string $skill): JsonResponse
    {
        $this->assertSkill($skill);
        $profile = $request->profile();

        $session = $this->mcqService->startSession(
            $profile,
            $skill,
            $request->validated('exercise_id'),
        );

        return response()->json([
            'data' => new PracticeSessionResource($session),
        ], 201);
    }

    public function submit(SubmitMcqSessionRequest $request, string $skill, PracticeSession $practiceSession): JsonResponse
    {
        $this->assertSkill($skill);
        Gate::authorize('submit', $practiceSession);
        $answers = $request->validated('answers');
        $result = $this->mcqService->submitSession($practiceSession, $skill, $answers);

        return response()->json(['data' => [
            'score' => $result['score'],
            'total' => $result['total'],
            'items' => $result['items'],
            'session' => (new PracticeSessionResource($result['session']))->resolve($request),
        ]]);
    }

    public function progress(Request $request, string $skill): JsonResponse
    {
        $this->assertSkill($skill);

        return response()->json([
            'data' => $this->mcqService->exerciseProgress($request->profile(), $skill),
        ]);
    }

    private function assertSkill(string $skill): void
    {
        if (! in_array($skill, ['listening', 'reading'], true)) {
            abort(404, 'Unknown skill.');
        }
    }
}
