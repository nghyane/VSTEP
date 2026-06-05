<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Feedback\ListFeedbackRequest;
use App\Http\Requests\Feedback\StoreFeedbackRequest;
use App\Http\Resources\ExerciseFeedbackResource;
use App\Services\FeedbackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class FeedbackController extends Controller
{
    public function __construct(
        private readonly FeedbackService $feedbackService,
    ) {}

    public function store(StoreFeedbackRequest $request): JsonResponse
    {
        $feedback = $this->feedbackService->create($request->profile(), $request->validated());

        return (new ExerciseFeedbackResource($feedback))->response()->setStatusCode(201);
    }

    public function index(ListFeedbackRequest $request): AnonymousResourceCollection
    {
        return ExerciseFeedbackResource::collection(
            $this->feedbackService->listForContent(
                (string) $request->validated('content_type'),
                (string) $request->validated('content_id'),
            ),
        );
    }
}
