<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ImportExamRequest;
use App\Http\Requests\Admin\StoreExamRequest;
use App\Http\Requests\Admin\UpdateExamRequest;
use App\Http\Resources\Admin\AdminExamResource;
use App\Models\Exam;
use App\Services\Admin\AdminExamService;
use App\Services\ExamImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

final class ExamController extends Controller
{
    public function __construct(
        private readonly AdminExamService $adminService,
        private readonly ExamImportService $importService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['q', 'is_published']);
        $perPage = (int) $request->input('per_page', 20);

        $paginator = $this->adminService->listExams($filters)
            ->paginate(min($perPage, 100));

        return AdminExamResource::collection($paginator)
            ->response();
    }

    public function store(StoreExamRequest $request): JsonResponse
    {
        $exam = $this->adminService->createExam($request->validated());

        return (new AdminExamResource($exam))
            ->response()
            ->setStatusCode(201);
    }

    public function show(string $id): JsonResponse
    {
        $exam = Exam::query()
            ->withCount('versions')
            ->with(['versions' => fn ($q) => $q->where('is_active', true)])
            ->findOrFail($id);

        return (new AdminExamResource($exam))->response();
    }

    public function update(UpdateExamRequest $request, string $id): JsonResponse
    {
        $exam = Exam::findOrFail($id);
        $exam = $this->adminService->updateExam($exam, $request->validated());

        return (new AdminExamResource($exam))->response();
    }

    public function destroy(string $id): Response
    {
        $exam = Exam::findOrFail($id);
        $this->adminService->deleteExam($exam);

        return response()->noContent();
    }

    public function publish(string $id): JsonResponse
    {
        $exam = Exam::findOrFail($id);
        $exam = $this->adminService->setPublished($exam, true);

        return (new AdminExamResource($exam))->response();
    }

    public function unpublish(string $id): JsonResponse
    {
        $exam = Exam::findOrFail($id);
        $exam = $this->adminService->setPublished($exam, false);

        return (new AdminExamResource($exam))->response();
    }

    /**
     * Import a complete exam (exam + version + all content) in one request.
     */
    public function import(ImportExamRequest $request): JsonResponse
    {
        $examData = $request->validated('exam');
        $versionData = $request->validated('version');

        $exam = $this->importService->importExam($examData, $versionData);

        return response()->json([
            'data' => [
                'id' => $exam->id,
                'slug' => $exam->slug,
                'title' => $exam->title,
                'version_id' => $exam->activeVersion()?->id,
            ],
        ], 201);
    }
}
