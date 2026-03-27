<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\StoreExamRequest;
use App\Http\Requests\Exam\UpdateExamRequest;
use App\Http\Resources\ExamResource;
use App\Http\Resources\ExamSessionDetailResource;
use App\Http\Resources\ExamSessionResource;
use App\Models\Exam;
use App\Services\ExamService;
use App\Services\SessionService;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    public function __construct(
        private readonly ExamService $examService,
        private readonly SessionService $sessionService,
    ) {}

    public function index(Request $request)
    {
        return ExamResource::collection($this->examService->list($request->only(['type', 'level', 'skill', 'search'])));
    }

    public function show(Exam $exam)
    {
        return new ExamResource($exam);
    }

    public function store(StoreExamRequest $request)
    {
        $exam = $this->examService->create($request->validated(), $request->user()->id);

        return (new ExamResource($exam))->response()->setStatusCode(201);
    }

    public function update(UpdateExamRequest $request, Exam $exam)
    {
        $exam = $this->examService->update($exam, $request->validated());

        return new ExamResource($exam);
    }

    public function destroy(Exam $exam)
    {
        $this->examService->delete($exam);

        return response()->json(['data' => ['success' => true]]);
    }

    public function start(Request $request, Exam $exam)
    {
        $session = $this->sessionService->start($exam, $request->user()->id);

        return (new ExamSessionDetailResource($this->sessionService->show($session)))->response()->setStatusCode(201);
    }
}
