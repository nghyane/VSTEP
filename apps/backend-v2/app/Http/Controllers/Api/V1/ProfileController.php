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

class ProfileController extends Controller
{
    public function __construct(
        private readonly ProfileService $profileService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $profiles = $this->profileService->listForAccount($request->user());

        return ProfileResource::collection($profiles);
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

    public function show(Request $request, string $id): ProfileResource
    {
        $profile = $this->findOwnedProfile($request, $id);

        return new ProfileResource($profile);
    }

    public function update(UpdateProfileRequest $request, string $id): ProfileResource
    {
        $profile = $this->findOwnedProfile($request, $id);
        /** @var array{nickname?:string,target_level?:string,target_deadline?:string,entry_level?:string|null} $data */
        $data = $request->validated();

        $updated = $this->profileService->update($profile, $data);

        return new ProfileResource($updated);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $profile = $this->findOwnedProfile($request, $id);
        $this->profileService->delete($profile);

        return response()->json(['data' => ['success' => true]]);
    }

    public function reset(ResetProfileRequest $request, string $id): JsonResponse
    {
        $profile = $this->findOwnedProfile($request, $id);
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

    public function onboarding(SubmitOnboardingRequest $request, string $id): JsonResponse
    {
        $profile = $this->findOwnedProfile($request, $id);
        /** @var array{weaknesses:array<int,string>,motivation:string|null,raw_answers:array<string,mixed>} $data */
        $data = $request->validated();

        $response = $this->profileService->saveOnboardingResponse($profile, $data);

        return response()->json(['data' => [
            'profile_id' => $response->profile_id,
            'completed_at' => $response->completed_at,
        ]]);
    }

    private function findOwnedProfile(Request $request, string $id): Profile
    {
        /** @var Profile $profile */
        $profile = Profile::query()->findOrFail($id);

        if ($profile->account_id !== $request->user()->id) {
            abort(403, 'Profile does not belong to authenticated user.');
        }

        return $profile;
    }
}
