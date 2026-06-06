<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\ListOrderHistoryRequest;
use App\Services\OrderHistoryService;
use Illuminate\Http\JsonResponse;

final class OrderHistoryController extends Controller
{
    public function __construct(private readonly OrderHistoryService $orders) {}

    public function index(ListOrderHistoryRequest $request): JsonResponse
    {
        $orders = $this->orders->orders($request->user(), $request->profile(), $request->validated());

        return response()->json([
            'data' => $orders->items(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
                'last_page' => $orders->lastPage(),
            ],
        ]);
    }
}
