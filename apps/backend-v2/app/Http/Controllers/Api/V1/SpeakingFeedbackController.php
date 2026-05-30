<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PracticeSpeakingSubmission;
use App\Services\PracticeFeedbackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * On-demand paid practice speaking feedback.
 */
final class SpeakingFeedbackController extends Controller
{
    public function __construct(
        private readonly PracticeFeedbackService $service,
    ) {}

    public function generate(Request $request, PracticeSpeakingSubmission $submission): JsonResponse
    {
        return response()->json([
            'data' => $this->service->requestSpeaking($request->profile(), $submission),
        ], 202);
    }
}
