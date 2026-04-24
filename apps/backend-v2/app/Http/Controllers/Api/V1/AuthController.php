<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\CompleteOnboardingRequest;
use App\Http\Requests\Auth\GoogleLoginRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\LogoutRequest;
use App\Http\Requests\Auth\RefreshRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\SwitchProfileRequest;
use App\Http\Resources\ProfileResource;
use App\Http\Resources\UserResource;
use App\Models\Profile;
use App\Models\SystemConfig;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $result = $this->authService->register(
            ['email' => $validated['email'], 'password' => $validated['password']],
            ['nickname' => $validated['nickname'], 'target_level' => $validated['target_level'], 'target_deadline' => $validated['target_deadline']],
        );

        return response()->json(['data' => [
            'user' => new UserResource($result['user']),
            'profile' => new ProfileResource($result['profile']),
            'access_token' => $result['access_token'],
            'refresh_token' => $result['refresh_token'],
            'expires_in' => $result['expires_in'],
            'onboarding_bonus' => $this->onboardingBonusPayload(),
        ]], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            $request->validated('email'),
            $request->validated('password'),
            $request->userAgent(),
        );

        return response()->json(['data' => [
            'user' => new UserResource($result['user']),
            'profile' => $result['profile'] ? new ProfileResource($result['profile']) : null,
            'access_token' => $result['access_token'],
            'refresh_token' => $result['refresh_token'],
            'expires_in' => $result['expires_in'],
        ]]);
    }

    public function googleLogin(GoogleLoginRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->loginWithGoogle(
                $request->validated('id_token'),
                $request->userAgent(),
            );
        } catch (\RuntimeException $e) {
            return response()->json(['message' => 'Token Google không hợp lệ.'], 401);
        }

        return response()->json(['data' => [
            'user' => new UserResource($result['user']),
            'profile' => $result['profile'] ? new ProfileResource($result['profile']) : null,
            'access_token' => $result['access_token'],
            'refresh_token' => $result['refresh_token'],
            'expires_in' => $result['expires_in'],
            'needs_onboarding' => $result['needs_onboarding'],
            'suggested_nickname' => $result['suggested_nickname'],
        ]]);
    }

    public function completeOnboarding(CompleteOnboardingRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $result = $this->authService->completeOnboarding($user, [
            'nickname' => $request->validated('nickname'),
            'target_level' => $request->validated('target_level'),
            'target_deadline' => $request->validated('target_deadline'),
        ]);

        return response()->json(['data' => [
            'profile' => new ProfileResource($result['profile']),
            'access_token' => $result['access_token'],
            'expires_in' => $result['expires_in'],
            'onboarding_bonus' => $this->onboardingBonusPayload(),
        ]]);
    }

    public function refresh(RefreshRequest $request): JsonResponse
    {
        $result = $this->authService->refresh(
            $request->validated('refresh_token'),
            $request->userAgent(),
        );

        return response()->json(['data' => [
            'access_token' => $result['access_token'],
            'refresh_token' => $result['refresh_token'],
            'expires_in' => $result['expires_in'],
            'profile' => $result['profile'] ? new ProfileResource($result['profile']) : null,
        ]]);
    }

    public function switchProfile(SwitchProfileRequest $request): JsonResponse
    {
        $result = $this->authService->switchProfile(
            $request->user(),
            $request->validated('profile_id'),
            $request->validated('refresh_token'),
            $request->userAgent(),
        );

        return response()->json(['data' => [
            'access_token' => $result['access_token'],
            'refresh_token' => $result['refresh_token'],
            'expires_in' => $result['expires_in'],
            'profile' => new ProfileResource($result['profile']),
        ]]);
    }

    public function logout(LogoutRequest $request): JsonResponse
    {
        $this->authService->logout(
            $request->validated('refresh_token'),
            $request->user(),
        );

        return response()->json(['data' => ['success' => true]]);
    }

    /**
     * @return array{amount:int,granted:bool}
     */
    private function onboardingBonusPayload(): array
    {
        $amount = (int) (SystemConfig::get('onboarding.initial_coins') ?? 0);

        return ['amount' => $amount, 'granted' => $amount > 0];
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $payload = JWTAuth::parseToken()->getPayload();
        $profileId = $payload->get('active_profile_id');

        $profile = null;
        if (is_string($profileId) && $profileId !== '') {
            $candidate = Profile::query()->find($profileId);
            if ($candidate !== null && $candidate->account_id === $user->id) {
                $profile = $candidate;
            }
        }

        return response()->json(['data' => [
            'user' => new UserResource($user),
            'profile' => $profile ? new ProfileResource($profile) : null,
        ]]);
    }
}
