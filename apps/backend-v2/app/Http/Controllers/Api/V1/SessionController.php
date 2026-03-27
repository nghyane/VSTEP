<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\SaveAnswerRequest;
use App\Http\Requests\Exam\SaveAnswersBatchRequest;
use App\Http\Resources\ExamSessionDetailResource;
use App\Http\Resources\ExamSessionResource;
use App\Models\ExamSession;
use App\Services\SessionService;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Authorize;

class SessionController extends Controller
{
    public function __construct(
        private readonly SessionService $service,
    ) {}

    public function index(Request $request)
    {
        return ExamSessionResource::collection(
            $this->service->list($request->user()->id, $request->query('status'), $request->query('exam_id')),
        );
    }

    #[Authorize('view', 'session')]
    public function show(ExamSession $session)
    {
        return new ExamSessionDetailResource($this->service->show($session));
    }

    #[Authorize('update', 'session')]
    public function saveAnswers(SaveAnswersBatchRequest $request, ExamSession $session)
    {
        $saved = $this->service->saveAnswersBatch($session, $request->validated('answers'));

        return response()->json(['data' => ['success' => true, 'saved' => $saved]]);
    }

    #[Authorize('update', 'session')]
    public function answer(SaveAnswerRequest $request, ExamSession $session)
    {
        $this->service->saveAnswer($session, $request->validated());

        return response()->json(['data' => ['success' => true]]);
    }

    #[Authorize('update', 'session')]
    public function submit(ExamSession $session)
    {
        $session = $this->service->submit($session);

        return new ExamSessionDetailResource($this->service->show($session));
    }
}
