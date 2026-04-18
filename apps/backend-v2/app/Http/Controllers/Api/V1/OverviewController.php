<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Services\ProgressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OverviewController extends Controller
{
    public function __construct(
        private readonly ProgressService $progressService,
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

    private function profile(Request $request): Profile
    {
        return $request->attributes->get('active_profile');
    }
}
