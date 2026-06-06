<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\TeacherGrading\StoreTeacherGradingRequest;
use App\Http\Resources\TeacherGradingRequestResource;
use App\Models\AssessmentAttempt;
use App\Services\Contracts\TeacherGradingRequestServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TeacherGradingRequestController extends Controller
{
    public function __construct(
        private readonly TeacherGradingRequestServiceInterface $service,
    ) {}

    public function show(Request $request, AssessmentAttempt $assessmentAttempt): JsonResponse
    {
        $gradingRequest = $this->service->showForLearner($request->profile(), $assessmentAttempt);

        if ($gradingRequest === null) {
            return response()->json(['data' => null]);
        }

        return (new TeacherGradingRequestResource($gradingRequest))->response();
    }

    public function store(StoreTeacherGradingRequest $request, AssessmentAttempt $assessmentAttempt): JsonResponse
    {
        $gradingRequest = $this->service->request(
            $request->profile(),
            $assessmentAttempt,
            $request->validated('student_note'),
        );

        return (new TeacherGradingRequestResource($gradingRequest))->response()->setStatusCode(202);
    }
}
