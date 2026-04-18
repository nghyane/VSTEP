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
use App\Models\Profile;
use App\Services\GrammarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class GrammarController extends Controller
{
    public function __construct(
        private readonly GrammarService $grammarService,
    ) {}

    public function points(Request $request): AnonymousResourceCollection
    {
        return GrammarPointResource::collection($this->grammarService->listPublishedPoints());
    }

    public function pointDetail(Request $request, string $id): JsonResponse
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);
        $profile = $this->profile($request);

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
        $profile = $this->profile($request);
        /** @var GrammarExercise $exercise */
        $exercise = GrammarExercise::query()->findOrFail($id);

        $session = $request->validated('session_id')
            ? PracticeSession::query()->find($request->validated('session_id'))
            : null;
        if ($session !== null && $session->profile_id !== $profile->id) {
            abort(403, 'Session does not belong to active profile.');
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

    private function profile(Request $request): Profile
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('active_profile');

        return $profile;
    }
}
