<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PracticeWritingSubmission;
use App\Services\PracticeFeedbackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * On-demand paid practice writing feedback.
 */
final class WritingFeedbackController extends Controller
{
    public function __construct(
        private readonly PracticeFeedbackService $service,
    ) {}

    public function generate(Request $request, PracticeWritingSubmission $submission): JsonResponse
    {
        return response()->json([
            'data' => $this->service->requestWriting($request->profile(), $submission),
        ], 202);
    }
}
