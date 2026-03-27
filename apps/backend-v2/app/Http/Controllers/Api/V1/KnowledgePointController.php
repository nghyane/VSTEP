<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\KnowledgePoint\StoreKnowledgePointRequest;
use App\Http\Requests\KnowledgePoint\UpdateKnowledgePointRequest;
use App\Http\Resources\KnowledgePointResource;
use App\Http\Resources\TopicResource;
use App\Models\KnowledgePoint;
use App\Services\KnowledgePointService;
use Illuminate\Http\Request;

class KnowledgePointController extends Controller
{
    public function __construct(
        private readonly KnowledgePointService $service,
    ) {}

    public function index(Request $request)
    {
        return KnowledgePointResource::collection($this->service->list($request->only(['category', 'search'])));
    }

    public function show(KnowledgePoint $knowledgePoint)
    {
        return new KnowledgePointResource($knowledgePoint);
    }

    public function store(StoreKnowledgePointRequest $request)
    {
        $kp = $this->service->create($request->validated());

        return (new KnowledgePointResource($kp))->response()->setStatusCode(201);
    }

    public function update(UpdateKnowledgePointRequest $request, KnowledgePoint $knowledgePoint)
    {
        $kp = $this->service->update($knowledgePoint, $request->validated());

        return new KnowledgePointResource($kp);
    }

    public function destroy(KnowledgePoint $knowledgePoint)
    {
        $this->service->delete($knowledgePoint);

        return response()->json(['data' => ['success' => true]]);
    }

    public function topics(Request $request)
    {
        return TopicResource::collection($this->service->topics($request->only(['category'])));
    }
}
