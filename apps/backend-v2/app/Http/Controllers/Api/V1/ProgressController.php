<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Enums\Skill;
use App\Http\Controllers\Controller;
use App\Http\Requests\Progress\StoreGoalRequest;
use App\Http\Requests\Progress\UpdateGoalRequest;
use App\Http\Resources\GoalResource;
use App\Http\Resources\LearningPathResource;
use App\Http\Resources\SkillDetailResource;
use App\Http\Resources\UserProgressResource;
use App\Models\UserGoal;
use App\Services\ProgressService;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Authorize;

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

        return response()->json(['data' => [
            'skills' => $data['skills'],
            'goal' => $data['goal'] ? new GoalResource($data['goal']) : null,
            'eta' => $data['eta'],
        ]]);
    }

    public function activity(Request $request)
    {
        $days = $request->integer('days', 30);

        return response()->json([
            'data' => $this->service->activity($request->user()->id, $days),
        ]);
    }

    public function bySkill(Request $request, string $skill)
    {
        $data = $this->service->bySkill($request->user()->id, Skill::from($skill));

        return new SkillDetailResource($data);
    }

    public function learningPath(Request $request)
    {
        $skills = $this->service->learningPath($request->user()->id);

        return new LearningPathResource($skills);
    }

    public function storeGoal(StoreGoalRequest $request)
    {
        $goal = $this->service->createGoal($request->user()->id, $request->validated());

        return (new GoalResource($goal))->response()->setStatusCode(201);
    }

    #[Authorize('update', 'goal')]
    public function updateGoal(UpdateGoalRequest $request, UserGoal $goal)
    {
        $goal = $this->service->updateGoal($goal, $request->validated());

        return new GoalResource($goal);
    }

    #[Authorize('delete', 'goal')]
    public function destroyGoal(UserGoal $goal)
    {
        $this->service->deleteGoal($goal);

        return response()->json(['data' => ['success' => true]]);
    }
}
