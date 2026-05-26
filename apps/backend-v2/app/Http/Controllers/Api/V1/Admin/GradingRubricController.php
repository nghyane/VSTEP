<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminGradingRubricResource;
use App\Services\Admin\AdminGradingRubricService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

final class GradingRubricController extends Controller
{
    public function __construct(
        private readonly AdminGradingRubricService $service,
    ) {}

    public function index(Request $request): ResourceCollection
    {
        $perPage = max(1, min($request->integer('per_page', 20), 100));

        $query = $this->service->listRubrics([
            'skill' => $request->string('skill')->toString() ?: null,
            'is_active' => $request->has('is_active')
                ? filter_var($request->input('is_active'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE)
                : null,
            'sort' => $request->string('sort')->toString() ?: null,
            'order' => $request->string('order')->toString() ?: null,
        ]);

        return AdminGradingRubricResource::collection($query->paginate($perPage));
    }

    public function show(string $id): AdminGradingRubricResource
    {
        $rubric = $this->service->showRubric($id);

        return new AdminGradingRubricResource($rubric);
    }
}
