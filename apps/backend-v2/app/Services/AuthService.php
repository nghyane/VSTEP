<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\Role;
use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthService
{
    private const MAX_REFRESH_TOKENS = 3;

    private const REFRESH_TOKEN_DAYS = 30;

    public function register(array $data): User
    {
        return User::create([...$data, 'role' => Role::Learner]);
    }

    public function login(string $email, string $password, ?string $userAgent = null): array
    {
        $token = JWTAuth::attempt(['email' => $email, 'password' => $password]);

        if (! $token) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password.'],
            ]);
        }

        /** @var User $user */
        $user = JWTAuth::user();
        [$refreshToken, $plainToken] = $this->createRefreshToken($user, $userAgent);

        return [
            'user' => $user,
            'access_token' => $token,
            'refresh_token' => $plainToken,
            'expires_in' => config('jwt.ttl') * 60,
        ];
    }

    public function refresh(string $plainToken, ?string $userAgent = null): array
    {
        $refreshToken = $this->findRefreshToken($plainToken);

        if (! $refreshToken || $refreshToken->isExpired()) {
            $refreshToken?->delete();

            throw ValidationException::withMessages([
                'refresh_token' => ['Invalid or expired refresh token.'],
            ]);
        }

        $user = $refreshToken->user;

        $refreshToken->delete();
        [$newRefreshToken, $newPlainToken] = $this->createRefreshToken($user, $userAgent);
        $accessToken = JWTAuth::fromUser($user);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $newPlainToken,
            'expires_in' => config('jwt.ttl') * 60,
        ];
    }

    public function logout(string $plainToken, User $user): void
    {
        $refreshToken = $this->findRefreshToken($plainToken, $user->id);
        $refreshToken?->delete();

        JWTAuth::invalidate(JWTAuth::getToken());
    }

    private function findRefreshToken(string $plainToken, ?string $userId = null): ?RefreshToken
    {
        $query = RefreshToken::query()->when($userId, fn ($q, $v) => $q->where('user_id', $v));

        foreach ($query->cursor() as $token) {
            if (Hash::check($plainToken, $token->token)) {
                return $token;
            }
        }

        return null;
    }

    /**
     * @return array{0: RefreshToken, 1: string}
     */
    private function createRefreshToken(User $user, ?string $userAgent): array
    {
        RefreshToken::where('user_id', $user->id)
            ->where('expires_at', '<', now())
            ->delete();

        $keep = self::MAX_REFRESH_TOKENS - 1;
        $staleIds = RefreshToken::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->skip($keep)
            ->pluck('id');

        if ($staleIds->isNotEmpty()) {
            RefreshToken::whereIn('id', $staleIds)->delete();
        }

        $plainToken = Str::random(64);

        $refreshToken = RefreshToken::create([
            'user_id' => $user->id,
            'token' => Hash::make($plainToken),
            'user_agent' => $userAgent,
            'expires_at' => now()->addDays(self::REFRESH_TOKEN_DAYS),
        ]);

        return [$refreshToken, $plainToken];
    }
}
