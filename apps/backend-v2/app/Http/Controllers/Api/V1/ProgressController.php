<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Progress\StoreGoalRequest;
use App\Http\Requests\Progress\UpdateGoalRequest;
use App\Http\Resources\GoalResource;
use App\Http\Resources\UserProgressResource;
use App\Services\ProgressService;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function __construct(
        private readonly ProgressService $service,
    ) {}

    public function index(Request $request)
    {
        $overview = $this->service->overview($request->user()->id);

        return response()->json(['data' => [
            'skills' => UserProgressResource::collection($overview['skills']),
            'goal' => $overview['goal'] ? new GoalResource($overview['goal']) : null,
        ]]);
    }

    public function spiderChart(Request $request)
    {
        $data = $this->service->spiderChart($request->user()->id);
        $data['goal'] = $data['goal'] ? new GoalResource($data['goal']) : null;

        return response()->json(['data' => $data]);
    }

    public function activity(Request $request)
    {
        $days = (int) $request->query('days', 30);

        return response()->json([
            'data' => $this->service->activity($request->user()->id, $days),
        ]);
    }

    public function bySkill(Request $request, string $skill)
    {
        $data = $this->service->bySkill($request->user()->id, $skill);
        $data['progress'] = $data['progress'] ? new UserProgressResource($data['progress']) : null;

        return response()->json(['data' => $data]);
    }

    public function learningPath(Request $request)
    {
        return response()->json([
            'data' => $this->service->learningPath($request->user()->id),
        ]);
    }

    public function storeGoal(StoreGoalRequest $request)
    {
        $goal = $this->service->createGoal($request->user()->id, $request->validated());

        return (new GoalResource($goal))->response()->setStatusCode(201);
    }

    public function updateGoal(UpdateGoalRequest $request, string $id)
    {
        $goal = $this->service->updateGoal($request->user()->id, $id, $request->validated());

        return new GoalResource($goal);
    }

    public function destroyGoal(Request $request, string $id)
    {
        $this->service->deleteGoal($request->user()->id, $id);

        return response()->json(['data' => ['id' => $id, 'deleted' => true]]);
    }
}
