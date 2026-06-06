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
use App\Models\VocabExercise;
use App\Models\VocabTopic;
use App\Models\VocabWord;
use App\Services\VocabService;
use App\Srs\FsrsConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

final class VocabController extends Controller
{
    public function __construct(
        private readonly VocabService $vocabService,
        private readonly FsrsConfig $fsrsConfig,
    ) {}

    public function topics(Request $request): AnonymousResourceCollection
    {
        $profile = $request->profile();
        $topics = $this->vocabService
            ->listPublishedTopics($profile)
            ->load('tasks');

        return VocabTopicResource::collection($topics);
    }

    public function topicDetail(Request $request, string $id): JsonResponse
    {
        /** @var VocabTopic $topic */
        $topic = VocabTopic::query()
            ->where('is_published', true)
            ->with('tasks')
            ->findOrFail($id);
        $profile = $request->profile();

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
        $profile = $request->profile();
        $limit = min((int) $request->integer('limit', 50), 200);

        $queue = $this->vocabService->buildDueQueue($profile, $limit);

        return response()->json(['data' => [
            'new_count' => $queue['new'],
            'learning_count' => $queue['learning'],
            'review_count' => $queue['review'],
            'next_due_at' => $queue['next_due_at'],
            'items' => array_map(fn (array $pair) => [
                'word' => (new VocabWordResource($pair['word']))->resolve($request),
                'state' => $pair['state']->toArray($this->fsrsConfig),
            ], $queue['items']),
        ]]);
    }

    public function review(ReviewWordRequest $request): JsonResponse
    {
        $profile = $request->profile();
        /** @var VocabWord $word */
        $word = VocabWord::query()
            ->whereHas('topic', fn ($query) => $query->where('is_published', true))
            ->findOrFail($request->validated('word_id'));

        $sessionId = $request->validated('session_id');
        $session = null;
        if ($sessionId !== null) {
            $session = PracticeSession::query()->findOrFail($sessionId);
            Gate::authorize('view', $session);
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
        $profile = $request->profile();
        /** @var VocabExercise $exercise */
        $exercise = VocabExercise::query()
            ->whereHas('topic', fn ($query) => $query->where('is_published', true))
            ->findOrFail($id);

        $sessionId = $request->validated('session_id');
        $session = null;
        if ($sessionId !== null) {
            $session = PracticeSession::query()->findOrFail($sessionId);
            Gate::authorize('view', $session);
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
}
