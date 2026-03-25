<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\Skill;
use App\Http\Controllers\Controller;
use App\Http\Requests\Practice\PracticeNextRequest;
use App\Http\Requests\Practice\SubmitPracticeRequest;
use App\Http\Resources\PracticeQuestionResource;
use App\Http\Resources\SubmissionResource;
use App\Models\Question;
use App\Services\PracticeService;
use App\Services\SubmissionService;

class PracticeController extends Controller
{
    public function __construct(
        private readonly PracticeService $practiceService,
        private readonly SubmissionService $submissionService,
    ) {}

    public function next(PracticeNextRequest $request)
    {
        $result = $this->practiceService->nextQuestion(
            $request->user()->id,
            Skill::from($request->validated('skill')),
            $request->integer('part') ?: null,
        );

        return response()->json(['data' => [
            'question' => $result['question'] ? new PracticeQuestionResource($result['question']) : null,
            'scaffold_level' => $result['scaffold_level'],
            'current_level' => $result['current_level'],
            'is_repeat' => $result['is_repeat'],
        ]]);
    }

    public function submit(SubmitPracticeRequest $request, Question $question)
    {
        $submission = $this->submissionService->submit(
            $request->user()->id,
            $question,
            $request->validated('answer'),
        );

        return (new SubmissionResource($submission))->response()->setStatusCode(201);
    }
}
