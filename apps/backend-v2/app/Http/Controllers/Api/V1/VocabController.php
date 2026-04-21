<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Vocab\AttemptExerciseRequest;
use App\Http\Requests\Vocab\ReviewWordRequest;
use App\Http\Resources\VocabExerciseResource;
use App\Http\Resources\VocabTopicResource;
use App\Http\Resources\VocabWordResource;
use App\Models\PracticeSession;
use App\Models\Profile;
use App\Models\VocabExercise;
use App\Models\VocabTopic;
use App\Models\VocabWord;
use App\Services\VocabService;
use App\Srs\FsrsConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VocabController extends Controller
{
    public function __construct(
        private readonly VocabService $vocabService,
        private readonly FsrsConfig $fsrsConfig,
    ) {}

    public function topics(Request $request): AnonymousResourceCollection
    {
        $topics = $this->vocabService
            ->listPublishedTopics()
            ->load('tasks');

        return VocabTopicResource::collection($topics);
    }

    public function topicDetail(Request $request, string $id): JsonResponse
    {
        /** @var VocabTopic $topic */
        $topic = VocabTopic::query()->with('tasks')->findOrFail($id);
        $profile = $this->profile($request);

        $data = $this->vocabService->getTopicForProfile($topic, $profile);

        return response()->json(['data' => [
            'topic' => (new VocabTopicResource($data['topic']))->resolve($request),
            'words' => array_map(
                fn (array $pair) => [
                    'word' => (new VocabWordResource($pair['word']))->resolve($request),
                    'state' => $pair['state']->toArray($this->fsrsConfig),
                ],
                $data['words'],
            ),
            'exercises' => VocabExerciseResource::collection($data['exercises'])->resolve($request),
        ]]);
    }

    public function srsQueue(Request $request): JsonResponse
    {
        $profile = $this->profile($request);
        $limit = min((int) $request->integer('limit', 50), 200);

        $queue = $this->vocabService->buildDueQueue($profile, $limit);

        return response()->json(['data' => [
            'new_count' => $queue['new'],
            'learning_count' => $queue['learning'],
            'review_count' => $queue['review'],
            'items' => array_map(fn (array $pair) => [
                'word' => (new VocabWordResource($pair['word']))->resolve($request),
                'state' => $pair['state']->toArray($this->fsrsConfig),
            ], $queue['items']),
        ]]);
    }

    public function review(ReviewWordRequest $request): JsonResponse
    {
        $profile = $this->profile($request);
        /** @var VocabWord $word */
        $word = VocabWord::query()->findOrFail($request->validated('word_id'));

        $session = $request->validated('session_id')
            ? PracticeSession::query()->find($request->validated('session_id'))
            : null;
        if ($session !== null && $session->profile_id !== $profile->id) {
            abort(403, 'Session does not belong to active profile.');
        }

        $result = $this->vocabService->review(
            $profile,
            $word,
            (int) $request->validated('rating'),
            $session,
        );

        return response()->json(['data' => [
            'state' => $result['state']->toArray($this->fsrsConfig),
            'review_id' => $result['review']->id,
        ]]);
    }

    public function attemptExercise(AttemptExerciseRequest $request, string $id): JsonResponse
    {
        $profile = $this->profile($request);
        /** @var VocabExercise $exercise */
        $exercise = VocabExercise::query()->findOrFail($id);

        $session = $request->validated('session_id')
            ? PracticeSession::query()->find($request->validated('session_id'))
            : null;
        if ($session !== null && $session->profile_id !== $profile->id) {
            abort(403, 'Session does not belong to active profile.');
        }

        /** @var array<string,mixed> $answer */
        $answer = $request->validated('answer');
        $result = $this->vocabService->attemptExercise($profile, $exercise, $answer, $session);

        return response()->json(['data' => [
            'attempt_id' => $result['attempt']->id,
            'is_correct' => $result['is_correct'],
            'explanation' => $result['explanation'],
        ]]);
    }

    private function profile(Request $request): Profile
    {
        /** @var Profile $profile */
        $profile = $request->attributes->get('active_profile');

        return $profile;
    }
}
