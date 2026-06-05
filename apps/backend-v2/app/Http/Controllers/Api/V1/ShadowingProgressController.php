<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Shadowing\StoreShadowingProgressRequest;
use App\Http\Resources\ShadowingProgressIndexResource;
use App\Http\Resources\ShadowingProgressResource;
use App\Services\ShadowingProgressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

final class ShadowingProgressController extends Controller
{
    public function __construct(
        private readonly ShadowingProgressService $shadowingProgress,
    ) {}

    public function index(Request $request): ShadowingProgressIndexResource
    {
        return new ShadowingProgressIndexResource(
            $this->shadowingProgress->groupedByLesson($request->profile()),
        );
    }

    public function store(StoreShadowingProgressRequest $request): JsonResponse
    {
        $progress = $this->shadowingProgress->store($request->profile(), $request->validated());

        return (new ShadowingProgressResource($progress))->response()->setStatusCode(201);
    }
}
