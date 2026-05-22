<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Listening\ReorderRequest;
use App\Http\Requests\Admin\Listening\StoreExerciseRequest;
use App\Http\Requests\Admin\Listening\StoreQuestionRequest;
use App\Http\Requests\Admin\Listening\UpdateExerciseRequest;
use App\Http\Requests\Admin\Listening\UpdateQuestionRequest;
use App\Http\Resources\Admin\AdminListeningExerciseResource;
use App\Http\Resources\Admin\AdminListeningQuestionResource;
use App\Models\PracticeListeningExercise;
use App\Models\PracticeListeningQuestion;
use App\Services\Admin\AdminMcqPracticeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;

final class ListeningController extends Controller
{
    public function __construct(
        private readonly AdminMcqPracticeService $service,
    ) {}

    public function indexExercises(Request $request): ResourceCollection
    {
        $perPage = max(1, min((int) $request->integer('per_page', 20), 100));

        $query = $this->service->listExercises(PracticeListeningExercise::class, [
            'q' => $request->string('q')->toString(),
            'is_published' => $request->has('is_published')
                ? filter_var($request->input('is_published'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE)
                : null,
            'part' => $request->integer('part') ?: null,
            'sort' => $request->string('sort')->toString() ?: null,
            'order' => $request->string('order')->toString() ?: null,
        ]);

        return AdminListeningExerciseResource::collection($query->paginate($perPage));
    }

    public function storeExercise(StoreExerciseRequest $request): JsonResponse
    {
        /** @var PracticeListeningExercise $exercise */
        $exercise = $this->service->createExercise(PracticeListeningExercise::class, $request->validated());

        return (new AdminListeningExerciseResource($exercise))->response()->setStatusCode(201);
    }

    public function showExercise(string $id): JsonResponse
    {
        /** @var PracticeListeningExercise $exercise */
        $exercise = PracticeListeningExercise::query()
            ->with(['questions' => fn ($q) => $q->orderBy('display_order')])
            ->withCount('questions')
            ->findOrFail($id);

        return response()->json(['data' => [
            'exercise' => (new AdminListeningExerciseResource($exercise))->resolve(request()),
            'questions' => AdminListeningQuestionResource::collection($exercise->questions)->resolve(request()),
        ]]);
    }

    public function updateExercise(UpdateExerciseRequest $request, string $id): AdminListeningExerciseResource
    {
        /** @var PracticeListeningExercise $exercise */
        $exercise = PracticeListeningExercise::query()->findOrFail($id);

        return new AdminListeningExerciseResource(
            $this->service->updateExercise($exercise, $request->validated()),
        );
    }

    public function destroyExercise(string $id): Response
    {
        /** @var PracticeListeningExercise $exercise */
        $exercise = PracticeListeningExercise::query()->findOrFail($id);
        $exercise->delete();

        return response()->noContent();
    }

    public function publishExercise(string $id): AdminListeningExerciseResource
    {
        /** @var PracticeListeningExercise $exercise */
        $exercise = PracticeListeningExercise::query()->findOrFail($id);

        return new AdminListeningExerciseResource($this->service->setPublished($exercise, true));
    }

    public function unpublishExercise(string $id): AdminListeningExerciseResource
    {
        /** @var PracticeListeningExercise $exercise */
        $exercise = PracticeListeningExercise::query()->findOrFail($id);

        return new AdminListeningExerciseResource($this->service->setPublished($exercise, false));
    }

    public function indexQuestions(string $id): AnonymousResourceCollection
    {
        /** @var PracticeListeningExercise $exercise */
        $exercise = PracticeListeningExercise::query()->findOrFail($id);

        return AdminListeningQuestionResource::collection(
            $exercise->questions()->orderBy('display_order')->get(),
        );
    }

    public function storeQuestion(StoreQuestionRequest $request, string $id): JsonResponse
    {
        /** @var PracticeListeningExercise $exercise */
        $exercise = PracticeListeningExercise::query()->findOrFail($id);
        /** @var PracticeListeningQuestion $question */
        $question = $this->service->createQuestion(
            PracticeListeningQuestion::class,
            $exercise,
            $request->validated(),
        );

        return (new AdminListeningQuestionResource($question))->response()->setStatusCode(201);
    }

    public function updateQuestion(UpdateQuestionRequest $request, string $questionId): AdminListeningQuestionResource
    {
        /** @var PracticeListeningQuestion $question */
        $question = PracticeListeningQuestion::query()->findOrFail($questionId);
        $question = $this->service->updateQuestion($question, $request->validated());

        return new AdminListeningQuestionResource($question);
    }

    public function destroyQuestion(string $questionId): Response
    {
        /** @var PracticeListeningQuestion $question */
        $question = PracticeListeningQuestion::query()->findOrFail($questionId);
        $question->delete();

        return response()->noContent();
    }

    public function reorderQuestions(ReorderRequest $request, string $id): Response
    {
        /** @var PracticeListeningExercise $exercise */
        $exercise = PracticeListeningExercise::query()->findOrFail($id);
        /** @var array<int,string> $ids */
        $ids = $request->validated('ids');
        $this->service->reorderQuestions(PracticeListeningQuestion::class, $exercise, $ids);

        return response()->noContent();
    }
}
