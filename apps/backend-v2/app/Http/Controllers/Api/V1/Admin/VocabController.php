<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Vocab\ReorderRequest;
use App\Http\Requests\Admin\Vocab\StoreExerciseRequest;
use App\Http\Requests\Admin\Vocab\StoreTopicRequest;
use App\Http\Requests\Admin\Vocab\StoreWordRequest;
use App\Http\Requests\Admin\Vocab\UpdateExerciseRequest;
use App\Http\Requests\Admin\Vocab\UpdateTopicRequest;
use App\Http\Requests\Admin\Vocab\UpdateWordRequest;
use App\Http\Resources\Admin\AdminVocabExerciseResource;
use App\Http\Resources\Admin\AdminVocabTopicResource;
use App\Http\Resources\Admin\AdminVocabWordResource;
use App\Models\VocabExercise;
use App\Models\VocabTopic;
use App\Models\VocabWord;
use App\Services\Admin\AdminVocabService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;

final class VocabController extends Controller
{
    public function __construct(
        private readonly AdminVocabService $service,
    ) {}

    public function indexTopics(Request $request): ResourceCollection
    {
        $perPage = (int) $request->integer('per_page', 20);
        $perPage = max(1, min($perPage, 100));

        $query = $this->service->listTopics([
            'q' => $request->string('q')->toString(),
            'is_published' => $request->has('is_published')
                ? filter_var($request->input('is_published'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE)
                : null,
            'level' => $request->string('level')->toString() ?: null,
            'sort' => $request->string('sort')->toString() ?: null,
            'order' => $request->string('order')->toString() ?: null,
        ]);

        return AdminVocabTopicResource::collection($query->paginate($perPage));
    }

    public function storeTopic(StoreTopicRequest $request): JsonResponse
    {
        $topic = $this->service->createTopic($request->validated());

        return (new AdminVocabTopicResource($topic))->response()->setStatusCode(201);
    }

    public function showTopic(string $id): JsonResponse
    {
        /** @var VocabTopic $topic */
        $topic = VocabTopic::query()
            ->with(['tasks', 'words' => fn ($q) => $q->orderBy('display_order'), 'exercises' => fn ($q) => $q->orderBy('display_order')])
            ->withCount(['words', 'exercises'])
            ->findOrFail($id);

        return response()->json(['data' => [
            'topic' => (new AdminVocabTopicResource($topic))->resolve(request()),
            'words' => AdminVocabWordResource::collection($topic->words)->resolve(request()),
            'exercises' => AdminVocabExerciseResource::collection($topic->exercises)->resolve(request()),
        ]]);
    }

    public function updateTopic(UpdateTopicRequest $request, string $id): AdminVocabTopicResource
    {
        /** @var VocabTopic $topic */
        $topic = VocabTopic::query()->findOrFail($id);
        $topic = $this->service->updateTopic($topic, $request->validated());

        return new AdminVocabTopicResource($topic);
    }

    public function destroyTopic(string $id): Response
    {
        /** @var VocabTopic $topic */
        $topic = VocabTopic::query()->findOrFail($id);
        $this->service->deleteTopic($topic);

        return response()->noContent();
    }

    public function publishTopic(string $id): AdminVocabTopicResource
    {
        /** @var VocabTopic $topic */
        $topic = VocabTopic::query()->findOrFail($id);

        return new AdminVocabTopicResource($this->service->setPublished($topic, true));
    }

    public function unpublishTopic(string $id): AdminVocabTopicResource
    {
        /** @var VocabTopic $topic */
        $topic = VocabTopic::query()->findOrFail($id);

        return new AdminVocabTopicResource($this->service->setPublished($topic, false));
    }

    public function indexWords(string $id): AnonymousResourceCollection
    {
        /** @var VocabTopic $topic */
        $topic = VocabTopic::query()->findOrFail($id);
        $words = $topic->words()->orderBy('display_order')->orderBy('word')->get();

        return AdminVocabWordResource::collection($words);
    }

    public function storeWord(StoreWordRequest $request, string $id): JsonResponse
    {
        /** @var VocabTopic $topic */
        $topic = VocabTopic::query()->findOrFail($id);
        $word = $this->service->createWord($topic, $request->validated());

        return (new AdminVocabWordResource($word))->response()->setStatusCode(201);
    }

    public function updateWord(UpdateWordRequest $request, string $wordId): AdminVocabWordResource
    {
        /** @var VocabWord $word */
        $word = VocabWord::query()->findOrFail($wordId);
        $word = $this->service->updateWord($word, $request->validated());

        return new AdminVocabWordResource($word);
    }

    public function destroyWord(string $wordId): Response
    {
        /** @var VocabWord $word */
        $word = VocabWord::query()->findOrFail($wordId);
        $this->service->deleteWord($word);

        return response()->noContent();
    }

    public function reorderWords(ReorderRequest $request, string $id): Response
    {
        /** @var VocabTopic $topic */
        $topic = VocabTopic::query()->findOrFail($id);
        /** @var array<int,string> $ids */
        $ids = $request->validated('ids');
        $this->service->reorderWords($topic, $ids);

        return response()->noContent();
    }

    public function indexExercises(string $id): AnonymousResourceCollection
    {
        /** @var VocabTopic $topic */
        $topic = VocabTopic::query()->findOrFail($id);
        $exercises = $topic->exercises()->orderBy('display_order')->get();

        return AdminVocabExerciseResource::collection($exercises);
    }

    public function storeExercise(StoreExerciseRequest $request, string $id): JsonResponse
    {
        /** @var VocabTopic $topic */
        $topic = VocabTopic::query()->findOrFail($id);
        $exercise = $this->service->createExercise($topic, $request->validated());

        return (new AdminVocabExerciseResource($exercise))->response()->setStatusCode(201);
    }

    public function updateExercise(UpdateExerciseRequest $request, string $exerciseId): AdminVocabExerciseResource
    {
        /** @var VocabExercise $exercise */
        $exercise = VocabExercise::query()->findOrFail($exerciseId);
        $exercise = $this->service->updateExercise($exercise, $request->validated());

        return new AdminVocabExerciseResource($exercise);
    }

    public function destroyExercise(string $exerciseId): Response
    {
        /** @var VocabExercise $exercise */
        $exercise = VocabExercise::query()->findOrFail($exerciseId);
        $this->service->deleteExercise($exercise);

        return response()->noContent();
    }

    public function reorderExercises(ReorderRequest $request, string $id): Response
    {
        /** @var VocabTopic $topic */
        $topic = VocabTopic::query()->findOrFail($id);
        /** @var array<int,string> $ids */
        $ids = $request->validated('ids');
        $this->service->reorderExercises($topic, $ids);

        return response()->noContent();
    }
}
