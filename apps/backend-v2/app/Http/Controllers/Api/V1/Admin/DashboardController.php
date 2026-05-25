<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminDashboardService;
use Illuminate\Http\JsonResponse;

final class DashboardController extends Controller
{
    public function __construct(
        private readonly AdminDashboardService $service,
    ) {}

    public function stats(): JsonResponse
    {
        return response()->json(['data' => $this->service->stats()]);
    }

    public function alerts(): JsonResponse
    {
        return response()->json(['data' => $this->service->alerts()]);
    }

    public function actionItems(): JsonResponse
    {
        return response()->json(['data' => $this->service->actionItems()]);
    }

    public function contentStatus(): JsonResponse
    {
        return response()->json(['data' => $this->service->contentStatus()]);
    }

    public function recentActivity(): JsonResponse
    {
        return response()->json(['data' => $this->service->recentActivity()]);
    }
}
