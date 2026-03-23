<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\LogoutRequest;
use App\Http\Requests\Auth\RefreshRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
    ) {}

    public function register(RegisterRequest $request)
    {
        $user = $this->authService->register($request->validated());

        return response()->json(['data' => [
            'user' => new UserResource($user),
            'message' => 'Registration successful.',
        ]], 201);
    }

    public function login(LoginRequest $request)
    {
        $result = $this->authService->login(
            $request->validated('email'),
            $request->validated('password'),
            $request->userAgent(),
        );

        return response()->json(['data' => [
            'user' => new UserResource($result['user']),
            'accessToken' => $result['accessToken'],
            'refreshToken' => $result['refreshToken'],
            'expiresIn' => $result['expiresIn'],
        ]]);
    }

    public function refresh(RefreshRequest $request)
    {
        $result = $this->authService->refresh(
            $request->validated('refreshToken'),
            $request->userAgent(),
        );

        return response()->json(['data' => $result]);
    }

    public function logout(LogoutRequest $request)
    {
        $this->authService->logout(
            $request->validated('refreshToken'),
            $request->user(),
        );

        return response()->json(['data' => ['message' => 'Logged out.']]);
    }

    public function me()
    {
        return new UserResource(auth()->user());
    }
}
