<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Question\StoreQuestionRequest;
use App\Http\Requests\Question\UpdateQuestionRequest;
use App\Http\Resources\QuestionResource;
use App\Models\Question;
use App\Services\QuestionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    public function __construct(
        private readonly QuestionService $service,
    ) {}

    public function index(Request $request)
    {
        return QuestionResource::collection($this->service->list($request->query()));
    }

    public function show(Question $question)
    {
        $question->load('knowledgePoints');

        return new QuestionResource($question);
    }

    public function store(StoreQuestionRequest $request)
    {
        $question = $this->service->create($request->validated(), $request->user()->id);

        return (new QuestionResource($question))->response()->setStatusCode(201);
    }

    public function update(UpdateQuestionRequest $request, Question $question)
    {
        $question = $this->service->update($question, $request->validated());

        return new QuestionResource($question);
    }

    public function destroy(Question $question)
    {
        $question->delete();

        return response()->json(['data' => ['id' => $question->id]]);
    }
}
