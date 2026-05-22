<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\CreateProfileRequest;
use App\Http\Requests\Profile\ResetProfileRequest;
use App\Http\Requests\Profile\SubmitOnboardingRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\ProfileResource;
use App\Models\Profile;
use App\Services\ProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

final class ProfileController extends Controller
{
    public function __construct(
        private readonly ProfileService $profileService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return ProfileResource::collection(
            $this->profileService->listForAccount($request->user()),
        );
    }

    public function store(CreateProfileRequest $request): JsonResponse
    {
        /** @var array{nickname:string,target_level:string,target_deadline:string,entry_level:string|null} $data */
        $data = $request->validated();
        $profile = $this->profileService->createAdditionalProfile($request->user(), $data);

        return response()->json([
            'data' => new ProfileResource($profile),
        ], 201);
    }

    public function show(Profile $profile): ProfileResource
    {
        Gate::authorize('view', $profile);

        return new ProfileResource($profile);
    }

    public function update(UpdateProfileRequest $request, Profile $profile): ProfileResource
    {
        Gate::authorize('update', $profile);
        /** @var array{nickname?:string,target_level?:string,target_deadline?:string,entry_level?:string|null} $data */
        $data = $request->validated();

        return new ProfileResource($this->profileService->update($profile, $data));
    }

    public function destroy(Profile $profile): JsonResponse
    {
        Gate::authorize('delete', $profile);
        $this->profileService->delete($profile);

        return response()->json(['data' => ['success' => true]]);
    }

    public function reset(ResetProfileRequest $request, Profile $profile): JsonResponse
    {
        Gate::authorize('reset', $profile);
        $event = $this->profileService->reset(
            $profile,
            $request->validated('reason'),
            [],
        );

        return response()->json(['data' => [
            'reset_at' => $event->reset_at,
            'wiped_entities' => $event->wiped_entities,
        ]]);
    }

    public function onboarding(SubmitOnboardingRequest $request, Profile $profile): JsonResponse
    {
        Gate::authorize('update', $profile);
        /** @var array{weaknesses:array<int,string>,motivation:string|null,raw_answers:array<string,mixed>} $data */
        $data = $request->validated();

        $response = $this->profileService->saveOnboardingResponse($profile, $data);

        return response()->json(['data' => [
            'profile_id' => $response->profile_id,
            'completed_at' => $response->completed_at,
        ]]);
    }
}
