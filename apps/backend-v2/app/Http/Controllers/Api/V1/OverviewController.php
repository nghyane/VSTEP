<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\ProgressService;
use App\Services\StreakMilestoneService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class OverviewController extends Controller
{
    public function __construct(
        private readonly ProgressService $progressService,
        private readonly StreakMilestoneService $streakMilestoneService,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->progressService->getOverview($request->profile()),
        ]);
    }

    public function practiceSummary(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->progressService->getPracticeSummary($request->profile()),
        ]);
    }

    public function streak(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->progressService->getStreak($request->profile()),
        ]);
    }

    public function activityHeatmap(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->progressService->getActivityHeatmap($request->profile()),
        ]);
    }

    public function claimStreakMilestone(Request $request, int $days): JsonResponse
    {
        return response()->json([
            'data' => $this->streakMilestoneService->claim($request->profile(), $days),
        ]);
    }
}
