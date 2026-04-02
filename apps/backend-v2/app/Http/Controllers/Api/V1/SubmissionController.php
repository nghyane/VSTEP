<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Submission\GradeSubmissionRequest;
use App\Http\Resources\SubmissionResource;
use App\Models\Submission;
use App\Services\SubmissionService;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Authorize;

class SubmissionController extends Controller
{
    public function __construct(
        private readonly SubmissionService $service,
    ) {}

    public function index(Request $request)
    {
        return SubmissionResource::collection(
            $this->service->list($request->user(), $request->only(['skill', 'status'])),
        );
    }

    #[Authorize('view', 'submission')]
    public function show(Submission $submission)
    {
        $submission->load(['question', 'practiceSession']);
        $submission->question?->makeHidden(['answer_key', 'explanation']);

        return new SubmissionResource($submission);
    }

    public function grade(GradeSubmissionRequest $request, Submission $submission)
    {
        $submission = $this->service->grade($submission, $request->validated());

        return new SubmissionResource($submission);
    }
}
