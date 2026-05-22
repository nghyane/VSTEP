<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePromoCodeRequest;
use App\Http\Requests\Admin\UpdatePromoCodeRequest;
use App\Http\Resources\Admin\AdminPromoCodeResource;
use App\Models\PromoCode;
use App\Services\Admin\AdminPromoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class PromoCodeController extends Controller
{
    public function __construct(private readonly AdminPromoService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $q = $request->string('q')->toString() ?: null;
        $status = $request->string('status')->toString() ?: null;
        $perPage = min(100, max(1, (int) $request->integer('per_page', 20)));

        return AdminPromoCodeResource::collection($this->service->list($q, $status)->paginate($perPage));
    }

    public function generateCode(): JsonResponse
    {
        return response()->json(['data' => ['code' => $this->service->generateUniqueCode()]]);
    }

    public function store(StorePromoCodeRequest $request): JsonResponse
    {
        $promo = $this->service->create($request->validated());

        return (new AdminPromoCodeResource($promo))->response()->setStatusCode(201);
    }

    public function show(string $id): AdminPromoCodeResource
    {
        $promo = PromoCode::query()->withCount('redemptions')->findOrFail($id);

        return new AdminPromoCodeResource($promo);
    }

    public function update(UpdatePromoCodeRequest $request, string $id): AdminPromoCodeResource
    {
        $promo = PromoCode::query()->findOrFail($id);
        $this->service->update($promo, $request->validated());
        $promo->loadCount('redemptions');

        return new AdminPromoCodeResource($promo);
    }
}
