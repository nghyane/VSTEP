<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\KnowledgePoint\StoreKnowledgePointRequest;
use App\Http\Requests\KnowledgePoint\UpdateKnowledgePointRequest;
use App\Http\Resources\KnowledgePointResource;
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
        return KnowledgePointResource::collection($this->service->list($request->query()));
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
        $knowledgePoint->update($request->validated());

        return new KnowledgePointResource($knowledgePoint);
    }

    public function destroy(KnowledgePoint $knowledgePoint)
    {
        $knowledgePoint->delete();

        return response()->json(['data' => ['id' => $knowledgePoint->id]]);
    }

    public function topics(Request $request)
    {
        return response()->json(['data' => $this->service->topics($request->query())]);
    }
}
