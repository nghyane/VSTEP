<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ListFinanceOrdersRequest;
use App\Services\Admin\FinanceService;
use Illuminate\Http\JsonResponse;

final class FinanceController extends Controller
{
    public function __construct(private readonly FinanceService $finance) {}

    public function summary(): JsonResponse
    {
        return response()->json(['data' => $this->finance->summary()]);
    }

    public function orders(ListFinanceOrdersRequest $request): JsonResponse
    {
        $orders = $this->finance->orders($request->validated());

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

    public function show(string $type, string $id): JsonResponse
    {
        return response()->json(['data' => $this->finance->orderDetail($type, $id)]);
    }

    public function topProducts(): JsonResponse
    {
        return response()->json(['data' => $this->finance->topProducts()]);
    }
}
