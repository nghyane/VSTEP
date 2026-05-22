<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Services\ProgressService;
use App\Services\StreakMilestoneService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OverviewController extends Controller
{
    public function __construct(
        private readonly ProgressService $progressService,
        private readonly StreakMilestoneService $streakMilestoneService,
    ) {}

    public function overview(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->progressService->getOverview($this->profile($request)),
        ]);
    }

    public function streak(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->progressService->getStreak($this->profile($request)),
        ]);
    }

    public function activityHeatmap(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->progressService->getActivityHeatmap($this->profile($request)),
        ]);
    }

    public function claimStreakMilestone(Request $request, int $days): JsonResponse
    {
        return response()->json([
            'data' => $this->streakMilestoneService->claim($this->profile($request), $days),
        ]);
    }

    private function profile(Request $request): Profile
    {
        return $request->attributes->get('active_profile');
    }
}
