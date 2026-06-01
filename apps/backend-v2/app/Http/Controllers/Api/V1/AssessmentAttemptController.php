<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\AssessmentAttempt;
use App\Services\AssessmentViewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AssessmentAttemptController extends Controller
{
    public function __construct(
        private readonly AssessmentViewService $service,
    ) {}

    public function show(Request $request, AssessmentAttempt $assessmentAttempt): JsonResponse
    {
        return response()->json([
            'data' => $this->service->show($request->profile(), $assessmentAttempt),
        ]);
    }

    public function requestFeedback(Request $request, AssessmentAttempt $assessmentAttempt): JsonResponse
    {
        return response()->json([
            'data' => $this->service->requestFeedback($request->profile(), $assessmentAttempt),
        ], 202);
    }
}
