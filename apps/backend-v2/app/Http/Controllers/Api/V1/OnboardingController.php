<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Onboarding\CompletePlacementRequest;
use App\Http\Requests\Onboarding\SelfAssessRequest;
use App\Http\Requests\Onboarding\SkipOnboardingRequest;
use App\Http\Resources\UserPlacementResource;
use App\Models\ExamSession;
use App\Services\OnboardingService;
use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    public function __construct(
        private readonly OnboardingService $service,
    ) {}

    public function status(Request $request)
    {
        return response()->json([
            'data' => $this->service->status($request->user()->id),
        ]);
    }

    public function selfAssess(SelfAssessRequest $request)
    {
        $placement = $this->service->selfAssess(
            $request->user()->id,
            $request->validated(),
        );

        return (new UserPlacementResource($placement))->response()->setStatusCode(201);
    }

    public function placement(Request $request)
    {
        $result = $this->service->startPlacement($request->user()->id);

        return response()->json(['data' => $result], 201);
    }

    public function completePlacement(CompletePlacementRequest $request, ExamSession $session)
    {
        $placement = $this->service->completePlacement(
            $request->user()->id,
            $session,
            $request->validated(),
        );

        return (new UserPlacementResource($placement))->response()->setStatusCode(201);
    }

    public function skip(SkipOnboardingRequest $request)
    {
        $placement = $this->service->skip(
            $request->user()->id,
            $request->validated(),
        );

        return (new UserPlacementResource($placement))->response()->setStatusCode(201);
    }
}
