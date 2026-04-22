<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ImportExamRequest;
use App\Services\ExamService;
use Illuminate\Http\JsonResponse;

class ExamController extends Controller
{
    public function __construct(
        private readonly ExamService $examService,
    ) {}

    /**
     * Import a complete exam (exam + version + all content) in one request.
     *
     * Validates at two levels:
     *   1. FormRequest — field types, required fields, basic constraints
     *   2. ExamVersionValidator — VSTEP structural rules (counts, types)
     *
     * All inserts happen in a single transaction. On failure, nothing is persisted.
     */
    public function import(ImportExamRequest $request): JsonResponse
    {
        $examData = $request->validated('exam');
        $versionData = $request->validated('version');

        $exam = $this->examService->importExam($examData, $versionData);

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
