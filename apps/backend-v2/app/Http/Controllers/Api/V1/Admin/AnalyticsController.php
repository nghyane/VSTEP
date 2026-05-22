<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class AnalyticsController extends Controller
{
    public function __construct(private readonly AnalyticsService $analytics) {}

    public function revenueOverview(): JsonResponse
    {
        return response()->json(['data' => $this->analytics->revenueOverview()]);
    }

    public function revenueTrend(Request $request): JsonResponse
    {
        $days = (int) $request->query('days', '30');

        return response()->json(['data' => $this->analytics->revenueTrend($days)]);
    }

    public function userGrowth(Request $request): JsonResponse
    {
        $days = (int) $request->query('days', '30');

        return response()->json(['data' => $this->analytics->userGrowth($days)]);
    }

    public function walletEconomy(): JsonResponse
    {
        return response()->json(['data' => $this->analytics->walletEconomy()]);
    }

    public function practiceActivity(Request $request): JsonResponse
    {
        $days = (int) $request->query('days', '30');

        return response()->json(['data' => $this->analytics->practiceActivity($days)]);
    }

    public function gradingThroughput(Request $request): JsonResponse
    {
        $days = (int) $request->query('days', '30');

        return response()->json(['data' => $this->analytics->gradingThroughput($days)]);
    }

    public function profileSegments(): JsonResponse
    {
        return response()->json(['data' => $this->analytics->profileSegments()]);
    }

    public function streakDistribution(): JsonResponse
    {
        return response()->json(['data' => $this->analytics->streakDistribution()]);
    }

    public function promoStats(): JsonResponse
    {
        return response()->json(['data' => $this->analytics->promoStats()]);
    }

    public function topContent(): JsonResponse
    {
        return response()->json(['data' => $this->analytics->topContent()]);
    }
}
