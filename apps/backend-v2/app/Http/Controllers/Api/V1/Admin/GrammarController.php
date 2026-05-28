<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Grammar\ReorderRequest;
use App\Http\Requests\Admin\Grammar\StoreExampleRequest;
use App\Http\Requests\Admin\Grammar\StoreExerciseRequest;
use App\Http\Requests\Admin\Grammar\StoreMistakeRequest;
use App\Http\Requests\Admin\Grammar\StorePointRequest;
use App\Http\Requests\Admin\Grammar\StoreStructureRequest;
use App\Http\Requests\Admin\Grammar\StoreTipRequest;
use App\Http\Requests\Admin\Grammar\UpdateExampleRequest;
use App\Http\Requests\Admin\Grammar\UpdateExerciseRequest;
use App\Http\Requests\Admin\Grammar\UpdateMistakeRequest;
use App\Http\Requests\Admin\Grammar\UpdatePointRequest;
use App\Http\Requests\Admin\Grammar\UpdateStructureRequest;
use App\Http\Requests\Admin\Grammar\UpdateTipRequest;
use App\Http\Resources\Admin\AdminGrammarExampleResource;
use App\Http\Resources\Admin\AdminGrammarExerciseResource;
use App\Http\Resources\Admin\AdminGrammarMistakeResource;
use App\Http\Resources\Admin\AdminGrammarPointResource;
use App\Http\Resources\Admin\AdminGrammarStructureResource;
use App\Http\Resources\Admin\AdminGrammarTipResource;
use App\Models\GrammarCommonMistake;
use App\Models\GrammarExample;
use App\Models\GrammarExercise;
use App\Models\GrammarPoint;
use App\Models\GrammarStructure;
use App\Models\GrammarVstepTip;
use App\Services\Admin\AdminGrammarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;

final class GrammarController extends Controller
{
    public function __construct(
        private readonly AdminGrammarService $service,
    ) {}

    public function indexPoints(Request $request): ResourceCollection
    {
        $perPage = max(1, min((int) $request->integer('per_page', 20), 100));

        $query = $this->service->listPoints([
            'q' => $request->string('q')->toString(),
            'is_published' => $request->has('is_published')
                ? filter_var($request->input('is_published'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE)
                : null,
            'category' => $request->string('category')->toString() ?: null,
            'sort' => $request->string('sort')->toString() ?: null,
            'order' => $request->string('order')->toString() ?: null,
        ]);

        return AdminGrammarPointResource::collection($query->paginate($perPage));
    }

    public function storePoint(StorePointRequest $request): JsonResponse
    {
        $point = $this->service->createPoint($request->validated());

        return (new AdminGrammarPointResource($point))->response()->setStatusCode(201);
    }

    public function showPoint(string $id): JsonResponse
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()
            ->with([
                'levels', 'tasks', 'functions',
                'structures' => fn ($q) => $q->orderBy('display_order'),
                'examples' => fn ($q) => $q->orderBy('display_order'),
                'commonMistakes' => fn ($q) => $q->orderBy('display_order'),
                'vstepTips' => fn ($q) => $q->orderBy('display_order'),
                'exercises' => fn ($q) => $q->where('is_active', true)->where('kind', 'mcq')->orderBy('display_order'),
            ])
            ->withCount([
                'structures', 'examples',
                'exercises' => fn ($query) => $query->where('is_active', true)->where('kind', 'mcq'),
            ])
            ->findOrFail($id);

        return response()->json(['data' => [
            'point' => (new AdminGrammarPointResource($point))->resolve(request()),
            'structures' => AdminGrammarStructureResource::collection($point->structures)->resolve(request()),
            'examples' => AdminGrammarExampleResource::collection($point->examples)->resolve(request()),
            'mistakes' => AdminGrammarMistakeResource::collection($point->commonMistakes)->resolve(request()),
            'tips' => AdminGrammarTipResource::collection($point->vstepTips)->resolve(request()),
            'exercises' => AdminGrammarExerciseResource::collection($point->exercises)->resolve(request()),
        ]]);
    }

    public function updatePoint(UpdatePointRequest $request, string $id): AdminGrammarPointResource
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);

        return new AdminGrammarPointResource($this->service->updatePoint($point, $request->validated()));
    }

    public function destroyPoint(string $id): Response
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);
        $this->service->deletePoint($point);

        return response()->noContent();
    }

    public function publishPoint(string $id): AdminGrammarPointResource
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);

        return new AdminGrammarPointResource($this->service->setPublished($point, true));
    }

    public function unpublishPoint(string $id): AdminGrammarPointResource
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);

        return new AdminGrammarPointResource($this->service->setPublished($point, false));
    }

    // ─── Structures ─────────────────────────────────────────────────

    public function indexStructures(string $id): AnonymousResourceCollection
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);

        return AdminGrammarStructureResource::collection(
            $point->structures()->orderBy('display_order')->get(),
        );
    }

    public function storeStructure(StoreStructureRequest $request, string $id): JsonResponse
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);
        /** @var GrammarStructure $row */
        $row = $this->service->createChild(GrammarStructure::class, $point, $request->validated());

        return (new AdminGrammarStructureResource($row))->response()->setStatusCode(201);
    }

    public function updateStructure(UpdateStructureRequest $request, string $childId): AdminGrammarStructureResource
    {
        /** @var GrammarStructure $row */
        $row = GrammarStructure::query()->findOrFail($childId);
        $row = $this->service->updateChild($row, $request->validated());

        return new AdminGrammarStructureResource($row);
    }

    public function destroyStructure(string $childId): Response
    {
        /** @var GrammarStructure $row */
        $row = GrammarStructure::query()->findOrFail($childId);
        $this->service->deleteChild($row);

        return response()->noContent();
    }

    public function reorderStructures(ReorderRequest $request, string $id): Response
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);
        /** @var array<int,string> $ids */
        $ids = $request->validated('ids');
        $this->service->reorder(GrammarStructure::class, $point, $ids);

        return response()->noContent();
    }

    // ─── Examples ───────────────────────────────────────────────────

    public function indexExamples(string $id): AnonymousResourceCollection
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);

        return AdminGrammarExampleResource::collection(
            $point->examples()->orderBy('display_order')->get(),
        );
    }

    public function storeExample(StoreExampleRequest $request, string $id): JsonResponse
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);
        /** @var GrammarExample $row */
        $row = $this->service->createChild(GrammarExample::class, $point, $request->validated());

        return (new AdminGrammarExampleResource($row))->response()->setStatusCode(201);
    }

    public function updateExample(UpdateExampleRequest $request, string $childId): AdminGrammarExampleResource
    {
        /** @var GrammarExample $row */
        $row = GrammarExample::query()->findOrFail($childId);
        $row = $this->service->updateChild($row, $request->validated());

        return new AdminGrammarExampleResource($row);
    }

    public function destroyExample(string $childId): Response
    {
        /** @var GrammarExample $row */
        $row = GrammarExample::query()->findOrFail($childId);
        $this->service->deleteChild($row);

        return response()->noContent();
    }

    public function reorderExamples(ReorderRequest $request, string $id): Response
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);
        /** @var array<int,string> $ids */
        $ids = $request->validated('ids');
        $this->service->reorder(GrammarExample::class, $point, $ids);

        return response()->noContent();
    }

    // ─── Common mistakes ────────────────────────────────────────────

    public function indexMistakes(string $id): AnonymousResourceCollection
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);

        return AdminGrammarMistakeResource::collection(
            $point->commonMistakes()->orderBy('display_order')->get(),
        );
    }

    public function storeMistake(StoreMistakeRequest $request, string $id): JsonResponse
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);
        /** @var GrammarCommonMistake $row */
        $row = $this->service->createChild(GrammarCommonMistake::class, $point, $request->validated());

        return (new AdminGrammarMistakeResource($row))->response()->setStatusCode(201);
    }

    public function updateMistake(UpdateMistakeRequest $request, string $childId): AdminGrammarMistakeResource
    {
        /** @var GrammarCommonMistake $row */
        $row = GrammarCommonMistake::query()->findOrFail($childId);
        $row = $this->service->updateChild($row, $request->validated());

        return new AdminGrammarMistakeResource($row);
    }

    public function destroyMistake(string $childId): Response
    {
        /** @var GrammarCommonMistake $row */
        $row = GrammarCommonMistake::query()->findOrFail($childId);
        $this->service->deleteChild($row);

        return response()->noContent();
    }

    public function reorderMistakes(ReorderRequest $request, string $id): Response
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);
        /** @var array<int,string> $ids */
        $ids = $request->validated('ids');
        $this->service->reorder(GrammarCommonMistake::class, $point, $ids);

        return response()->noContent();
    }

    // ─── VSTEP tips ─────────────────────────────────────────────────

    public function indexTips(string $id): AnonymousResourceCollection
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);

        return AdminGrammarTipResource::collection(
            $point->vstepTips()->orderBy('display_order')->get(),
        );
    }

    public function storeTip(StoreTipRequest $request, string $id): JsonResponse
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);
        /** @var GrammarVstepTip $row */
        $row = $this->service->createChild(GrammarVstepTip::class, $point, $request->validated());

        return (new AdminGrammarTipResource($row))->response()->setStatusCode(201);
    }

    public function updateTip(UpdateTipRequest $request, string $childId): AdminGrammarTipResource
    {
        /** @var GrammarVstepTip $row */
        $row = GrammarVstepTip::query()->findOrFail($childId);
        $row = $this->service->updateChild($row, $request->validated());

        return new AdminGrammarTipResource($row);
    }

    public function destroyTip(string $childId): Response
    {
        /** @var GrammarVstepTip $row */
        $row = GrammarVstepTip::query()->findOrFail($childId);
        $this->service->deleteChild($row);

        return response()->noContent();
    }

    public function reorderTips(ReorderRequest $request, string $id): Response
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);
        /** @var array<int,string> $ids */
        $ids = $request->validated('ids');
        $this->service->reorder(GrammarVstepTip::class, $point, $ids);

        return response()->noContent();
    }

    // ─── Exercises ──────────────────────────────────────────────────

    public function indexExercises(string $id): AnonymousResourceCollection
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);

        return AdminGrammarExerciseResource::collection(
            $point->exercises()->where('is_active', true)->where('kind', 'mcq')->orderBy('display_order')->get(),
        );
    }

    public function storeExercise(StoreExerciseRequest $request, string $id): JsonResponse
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);
        $exercise = $this->service->createExercise($point, $request->validated());

        return (new AdminGrammarExerciseResource($exercise))->response()->setStatusCode(201);
    }

    public function updateExercise(UpdateExerciseRequest $request, string $childId): AdminGrammarExerciseResource
    {
        /** @var GrammarExercise $exercise */
        $exercise = GrammarExercise::query()->findOrFail($childId);
        $exercise = $this->service->updateExercise($exercise, $request->validated());

        return new AdminGrammarExerciseResource($exercise);
    }

    public function destroyExercise(string $childId): Response
    {
        /** @var GrammarExercise $exercise */
        $exercise = GrammarExercise::query()->findOrFail($childId);
        $this->service->deleteChild($exercise);

        return response()->noContent();
    }

    public function reorderExercises(ReorderRequest $request, string $id): Response
    {
        /** @var GrammarPoint $point */
        $point = GrammarPoint::query()->findOrFail($id);
        /** @var array<int,string> $ids */
        $ids = $request->validated('ids');
        $this->service->reorder(GrammarExercise::class, $point, $ids);

        return response()->noContent();
    }
}
