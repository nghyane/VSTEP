<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\HealthCheckService;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    public function __construct(
        private readonly HealthCheckService $healthCheckService,
    ) {}

    public function show(): JsonResponse
    {
        $health = $this->healthCheckService->check();

        return response()->json($health, $health['status'] === 'ok' ? 200 : 503);
    }
}
