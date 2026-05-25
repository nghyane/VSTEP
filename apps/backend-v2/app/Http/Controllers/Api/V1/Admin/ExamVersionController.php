<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminExamVersionResource;
use App\Models\Exam;
use App\Models\ExamVersion;
use App\Services\Admin\AdminExamVersionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

final class ExamVersionController extends Controller
{
    public function __construct(
        private readonly AdminExamVersionService $service,
    ) {}

    public function index(string $examId): JsonResponse
    {
        $exam = Exam::findOrFail($examId);
        $versions = $this->service->listVersions($exam);

        return AdminExamVersionResource::collection($versions)->response();
    }

    public function show(string $examId, string $versionId): JsonResponse
    {
        $version = ExamVersion::query()
            ->where('exam_id', $examId)
            ->findOrFail($versionId);

        $version = $this->service->getVersionDetail($version);

        return (new AdminExamVersionResource($version))->response();
    }

    public function store(string $examId): JsonResponse
    {
        $exam = Exam::findOrFail($examId);
        $version = $this->service->createVersion($exam);

        return (new AdminExamVersionResource($version))
            ->response()
            ->setStatusCode(201);
    }

    public function setActive(string $examId, string $versionId): JsonResponse
    {
        $version = ExamVersion::query()
            ->where('exam_id', $examId)
            ->findOrFail($versionId);

        $version = $this->service->setActive($version);

        return (new AdminExamVersionResource($version))->response();
    }

    public function destroy(string $examId, string $versionId): Response
    {
        $version = ExamVersion::query()
            ->where('exam_id', $examId)
            ->findOrFail($versionId);

        $this->service->deleteVersion($version);

        return response()->noContent();
    }
}
