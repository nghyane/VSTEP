<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Feedback\StoreFeedbackRequest;
use App\Models\ExerciseFeedback;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class FeedbackController extends Controller
{
    public function store(StoreFeedbackRequest $request): JsonResponse
    {
        $feedback = ExerciseFeedback::create([
            'profile_id' => $request->profile()->id,
            ...$request->validated(),
        ]);

        return response()->json(['data' => $feedback], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'content_type' => ['required', 'string'],
            'content_id' => ['required', 'uuid'],
        ]);

        $feedbacks = ExerciseFeedback::query()
            ->where('content_type', $request->input('content_type'))
            ->where('content_id', $request->input('content_id'))
            ->with('profile:id,nickname')
            ->latest()
            ->limit(50)
            ->get();

        return response()->json(['data' => $feedbacks]);
    }
}
