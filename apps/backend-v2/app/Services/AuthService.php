<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthService
{
    private const MAX_REFRESH_TOKENS = 3;
    private const REFRESH_TOKEN_DAYS = 30;

    public function register(array $data): User
    {
        return User::create([
            'full_name' => $data['full_name'] ?? null,
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => Role::Learner,
        ]);
    }

    public function login(string $email, string $password, ?string $userAgent = null): array
    {
        $token = JWTAuth::attempt(['email' => $email, 'password' => $password]);

        if (!$token) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password.'],
            ]);
        }

        $user = auth()->user();
        $refreshToken = $this->createRefreshToken($user, $userAgent);

        return [
            'user' => $user,
            'access_token' => $token,
            'refresh_token' => $refreshToken->token,
            'expires_in' => config('jwt.ttl') * 60,
        ];
    }

    public function refresh(string $token, ?string $userAgent = null): array
    {
        $refreshToken = RefreshToken::where('token', $token)->first();

        if (!$refreshToken || $refreshToken->isExpired()) {
            if ($refreshToken) {
                RefreshToken::where('user_id', $refreshToken->user_id)->delete();
            }

            throw ValidationException::withMessages([
                'refresh_token' => ['Invalid or expired refresh token.'],
            ]);
        }

        $user = $refreshToken->user;

        $refreshToken->delete();
        $newRefreshToken = $this->createRefreshToken($user, $userAgent);
        $accessToken = JWTAuth::fromUser($user);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $newRefreshToken->token,
            'expires_in' => config('jwt.ttl') * 60,
        ];
    }

    public function logout(string $refreshTokenValue, User $user): void
    {
        RefreshToken::where('token', $refreshTokenValue)
            ->where('user_id', $user->id)
            ->delete();

        JWTAuth::invalidate(JWTAuth::getToken());
    }

    private function createRefreshToken(User $user, ?string $userAgent): RefreshToken
    {
        $existing = RefreshToken::where('user_id', $user->id)
            ->orderBy('created_at', 'asc')
            ->get();

        if ($existing->count() >= self::MAX_REFRESH_TOKENS) {
            $toDelete = $existing->take($existing->count() - self::MAX_REFRESH_TOKENS + 1);
            RefreshToken::whereIn('id', $toDelete->pluck('id'))->delete();
        }

        return RefreshToken::create([
            'user_id' => $user->id,
            'token' => Str::random(64),
            'user_agent' => $userAgent,
            'expires_at' => now()->addDays(self::REFRESH_TOKEN_DAYS),
        ]);
    }
}
