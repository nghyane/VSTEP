<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Reading\ReorderRequest;
use App\Http\Requests\Admin\Reading\StoreExerciseRequest;
use App\Http\Requests\Admin\Reading\StoreQuestionRequest;
use App\Http\Requests\Admin\Reading\UpdateExerciseRequest;
use App\Http\Requests\Admin\Reading\UpdateQuestionRequest;
use App\Http\Resources\Admin\AdminReadingExerciseResource;
use App\Http\Resources\Admin\AdminReadingQuestionResource;
use App\Models\PracticeReadingExercise;
use App\Models\PracticeReadingQuestion;
use App\Services\Admin\AdminMcqPracticeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;

class ReadingController extends Controller
{
    public function __construct(
        private readonly AdminMcqPracticeService $service,
    ) {}

    public function indexExercises(Request $request): ResourceCollection
    {
        $perPage = max(1, min((int) $request->integer('per_page', 20), 100));

        $query = $this->service->listExercises(PracticeReadingExercise::class, [
            'q' => $request->string('q')->toString(),
            'is_published' => $request->has('is_published')
                ? filter_var($request->input('is_published'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE)
                : null,
            'part' => $request->integer('part') ?: null,
            'sort' => $request->string('sort')->toString() ?: null,
            'order' => $request->string('order')->toString() ?: null,
        ]);

        return AdminReadingExerciseResource::collection($query->paginate($perPage));
    }

    public function storeExercise(StoreExerciseRequest $request): JsonResponse
    {
        /** @var PracticeReadingExercise $exercise */
        $exercise = $this->service->createExercise(PracticeReadingExercise::class, $request->validated());

        return (new AdminReadingExerciseResource($exercise))->response()->setStatusCode(201);
    }

    public function showExercise(string $id): JsonResponse
    {
        /** @var PracticeReadingExercise $exercise */
        $exercise = PracticeReadingExercise::query()
            ->with(['questions' => fn ($q) => $q->orderBy('display_order')])
            ->withCount('questions')
            ->findOrFail($id);

        return response()->json(['data' => [
            'exercise' => (new AdminReadingExerciseResource($exercise))->resolve(request()),
            'questions' => AdminReadingQuestionResource::collection($exercise->questions)->resolve(request()),
        ]]);
    }

    public function updateExercise(UpdateExerciseRequest $request, string $id): AdminReadingExerciseResource
    {
        /** @var PracticeReadingExercise $exercise */
        $exercise = PracticeReadingExercise::query()->findOrFail($id);

        return new AdminReadingExerciseResource(
            $this->service->updateExercise($exercise, $request->validated()),
        );
    }

    public function destroyExercise(string $id): Response
    {
        /** @var PracticeReadingExercise $exercise */
        $exercise = PracticeReadingExercise::query()->findOrFail($id);
        $exercise->delete();

        return response()->noContent();
    }

    public function publishExercise(string $id): AdminReadingExerciseResource
    {
        /** @var PracticeReadingExercise $exercise */
        $exercise = PracticeReadingExercise::query()->findOrFail($id);

        return new AdminReadingExerciseResource($this->service->setPublished($exercise, true));
    }

    public function unpublishExercise(string $id): AdminReadingExerciseResource
    {
        /** @var PracticeReadingExercise $exercise */
        $exercise = PracticeReadingExercise::query()->findOrFail($id);

        return new AdminReadingExerciseResource($this->service->setPublished($exercise, false));
    }

    public function indexQuestions(string $id): AnonymousResourceCollection
    {
        /** @var PracticeReadingExercise $exercise */
        $exercise = PracticeReadingExercise::query()->findOrFail($id);

        return AdminReadingQuestionResource::collection(
            $exercise->questions()->orderBy('display_order')->get(),
        );
    }

    public function storeQuestion(StoreQuestionRequest $request, string $id): JsonResponse
    {
        /** @var PracticeReadingExercise $exercise */
        $exercise = PracticeReadingExercise::query()->findOrFail($id);
        /** @var PracticeReadingQuestion $question */
        $question = $this->service->createQuestion(
            PracticeReadingQuestion::class,
            $exercise,
            $request->validated(),
        );

        return (new AdminReadingQuestionResource($question))->response()->setStatusCode(201);
    }

    public function updateQuestion(UpdateQuestionRequest $request, string $questionId): AdminReadingQuestionResource
    {
        /** @var PracticeReadingQuestion $question */
        $question = PracticeReadingQuestion::query()->findOrFail($questionId);
        $question = $this->service->updateQuestion($question, $request->validated());

        return new AdminReadingQuestionResource($question);
    }

    public function destroyQuestion(string $questionId): Response
    {
        /** @var PracticeReadingQuestion $question */
        $question = PracticeReadingQuestion::query()->findOrFail($questionId);
        $question->delete();

        return response()->noContent();
    }

    public function reorderQuestions(ReorderRequest $request, string $id): Response
    {
        /** @var PracticeReadingExercise $exercise */
        $exercise = PracticeReadingExercise::query()->findOrFail($id);
        /** @var array<int,string> $ids */
        $ids = $request->validated('ids');
        $this->service->reorderQuestions(PracticeReadingQuestion::class, $exercise, $ids);

        return response()->noContent();
    }
}
