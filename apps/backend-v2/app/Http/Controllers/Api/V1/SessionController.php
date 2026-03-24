<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\SaveAnswerRequest;
use App\Http\Requests\Exam\SaveAnswersBatchRequest;
use App\Http\Resources\ExamSessionResource;
use App\Services\ExamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function __construct(
        private readonly ExamService $service,
    ) {}

    public function index(Request $request)
    {
        return ExamSessionResource::collection(
            $this->service->listSessions($request->user()->id, $request->query()),
        );
    }

    public function show(Request $request, string $sessionId)
    {
        $session = $this->service->findSession($sessionId, $request->user()->id);

        return new ExamSessionResource($session);
    }

    public function saveAnswers(SaveAnswersBatchRequest $request, string $sessionId)
    {
        $saved = $this->service->saveAnswersBatch(
            $sessionId,
            $request->user()->id,
            $request->validated('answers'),
        );

        return response()->json(['data' => ['success' => true, 'saved' => $saved]]);
    }

    public function answer(SaveAnswerRequest $request, string $sessionId)
    {
        $this->service->saveAnswer(
            $sessionId,
            $request->user()->id,
            $request->validated(),
        );

        return response()->json(['data' => ['success' => true]]);
    }

    public function submit(Request $request, string $sessionId)
    {
        $session = $this->service->submitSession($sessionId, $request->user()->id);

        return new ExamSessionResource($session);
    }
}
