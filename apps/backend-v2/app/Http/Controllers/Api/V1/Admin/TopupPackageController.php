<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Topup\StorePackageRequest;
use App\Http\Requests\Admin\Topup\UpdatePackageRequest;
use App\Http\Resources\Admin\AdminTopupPackageResource;
use App\Models\WalletTopupPackage;
use App\Services\Admin\AdminTopupPackageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;

/**
 * Admin CRUD cho `wallet_topup_packages` (Plans tab).
 *
 * Toggle is_active có endpoint riêng (RFC 0022 §URL convention) — dễ
 * rate-limit/audit về sau. Order lifecycle do `TopupService` xử lý, không
 * chạm controller này.
 */
final class TopupPackageController extends Controller
{
    public function __construct(
        private readonly AdminTopupPackageService $service,
    ) {}

    public function index(Request $request): ResourceCollection
    {
        $perPage = (int) $request->integer('per_page', 20);
        $perPage = max(1, min($perPage, 100));

        $isActive = $request->has('is_active')
            ? filter_var($request->input('is_active'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE)
            : null;

        $query = $this->service->listPackages([
            'q' => $request->string('q')->toString(),
            'is_active' => $isActive,
            'sort' => $request->string('sort')->toString() ?: null,
            'order' => $request->string('order')->toString() ?: null,
        ]);

        return AdminTopupPackageResource::collection($query->paginate($perPage));
    }

    public function show(string $id): AdminTopupPackageResource
    {
        /** @var WalletTopupPackage $package */
        $package = WalletTopupPackage::query()->findOrFail($id);

        return new AdminTopupPackageResource($package);
    }

    public function store(StorePackageRequest $request): JsonResponse
    {
        $package = $this->service->createPackage($request->validated());

        return (new AdminTopupPackageResource($package))->response()->setStatusCode(201);
    }

    public function update(UpdatePackageRequest $request, string $id): AdminTopupPackageResource
    {
        /** @var WalletTopupPackage $package */
        $package = WalletTopupPackage::query()->findOrFail($id);

        return new AdminTopupPackageResource($this->service->updatePackage($package, $request->validated()));
    }

    public function destroy(string $id): Response
    {
        /** @var WalletTopupPackage $package */
        $package = WalletTopupPackage::query()->findOrFail($id);
        $this->service->deletePackage($package);

        return response()->noContent();
    }

    public function activate(string $id): AdminTopupPackageResource
    {
        return $this->toggleActive($id, true);
    }

    public function deactivate(string $id): AdminTopupPackageResource
    {
        return $this->toggleActive($id, false);
    }

    private function toggleActive(string $id, bool $active): AdminTopupPackageResource
    {
        /** @var WalletTopupPackage $package */
        $package = WalletTopupPackage::query()->findOrFail($id);

        return new AdminTopupPackageResource($this->service->setActive($package, $active));
    }
}
