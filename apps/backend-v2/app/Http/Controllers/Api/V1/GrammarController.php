<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Grammar\AttemptExerciseRequest;
use App\Http\Resources\GrammarExerciseResource;
use App\Http\Resources\GrammarMasteryResource;
use App\Http\Resources\GrammarPointResource;
use App\Models\GrammarExercise;
use App\Models\GrammarPoint;
use App\Models\PracticeSession;
use App\Services\GrammarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

final class GrammarController extends Controller
{
    public function __construct(
        private readonly GrammarService $grammarService,
    ) {}

    public function points(Request $request): JsonResponse
    {
        $profile = $request->profile();
        $points = $this->grammarService->listPublishedPoints();
        $masteryMap = $this->grammarService->getMasteryMap($profile);
        $exerciseCounts = $this->grammarService->getExerciseCounts();
        $distinctCorrects = $this->grammarService->getDistinctCorrectMap($profile);

        $data = $points->map(function (GrammarPoint $point) use ($request, $masteryMap, $exerciseCounts, $distinctCorrects) {
            $resource = (new GrammarPointResource($point))->resolve($request);
            $mastery = $masteryMap[$point->id] ?? null;
            $resource['mastery'] = $mastery ? (new GrammarMasteryResource($mastery))->resolve($request) : null;
            $resource['exercise_count'] = $exerciseCounts[$point->id] ?? 0;
            $resource['distinct_correct'] = $distinctCorrects[$point->id] ?? 0;

            return $resource;
        });

        return response()->json(['data' => $data]);
    }

    public function pointDetail(Request $request, string $id): JsonResponse
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);
        $profile = $request->profile();

        $data = $this->grammarService->getPointForProfile($point, $profile);
        $point = $data['point'];

        return response()->json(['data' => [
            'point' => (new GrammarPointResource($point))->resolve($request),
            'structures' => $point->structures->sortBy('display_order')->values()->map(fn ($s) => [
                'id' => $s->id,
                'template' => $s->template,
                'description' => $s->description,
            ])->all(),
            'examples' => $point->examples->sortBy('display_order')->values()->map(fn ($e) => [
                'id' => $e->id, 'en' => $e->en, 'vi' => $e->vi, 'note' => $e->note,
            ])->all(),
            'common_mistakes' => $point->commonMistakes->sortBy('display_order')->values()->map(fn ($m) => [
                'id' => $m->id, 'wrong' => $m->wrong, 'correct' => $m->correct, 'explanation' => $m->explanation,
            ])->all(),
            'vstep_tips' => $point->vstepTips->sortBy('display_order')->values()->map(fn ($t) => [
                'id' => $t->id, 'task' => $t->task, 'tip' => $t->tip, 'example' => $t->example,
            ])->all(),
            'exercises' => GrammarExerciseResource::collection($point->exercises->sortBy('display_order')->values())
                ->resolve($request),
            'mastery' => $data['mastery'] ? (new GrammarMasteryResource($data['mastery']))->resolve($request) : null,
        ]]);
    }

    public function attemptExercise(AttemptExerciseRequest $request, string $id): JsonResponse
    {
        $profile = $request->profile();
        /** @var GrammarExercise $exercise */
        $exercise = GrammarExercise::query()
            ->where('is_active', true)
            ->where('kind', 'mcq')
            ->findOrFail($id);

        $sessionId = $request->validated('session_id');
        $session = null;
        if ($sessionId !== null) {
            $session = PracticeSession::query()->findOrFail($sessionId);
            Gate::authorize('view', $session);
        }

        /** @var array<string,mixed> $answer */
        $answer = $request->validated('answer');
        $result = $this->grammarService->attemptExercise($profile, $exercise, $answer, $session);

        return response()->json(['data' => [
            'attempt_id' => $result['attempt']->id,
            'is_correct' => $result['is_correct'],
            'explanation' => $result['explanation'],
            'mastery' => (new GrammarMasteryResource($result['mastery']))->resolve($request),
        ]]);
    }
}
