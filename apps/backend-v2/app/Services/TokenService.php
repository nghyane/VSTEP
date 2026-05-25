<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Profile;
use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

final class TokenService
{
    private const MAX_REFRESH_TOKENS = 3;

    private const REFRESH_TOKEN_DAYS = 30;

    public function issueAccessToken(User $user, ?Profile $profile = null): string
    {
        return JWTAuth::claims([
            'role' => $user->role->value,
            'active_profile_id' => $profile?->id,
        ])->fromUser($user);
    }

    public function findRefreshToken(string $plainToken, ?string $userId = null): ?RefreshToken
    {
        $query = RefreshToken::query()->where('token_hash', hash('sha256', $plainToken));
        if ($userId !== null) {
            $query->where('user_id', $userId);
        }

        return $query->first();
    }

    /**
     * @return array{RefreshToken, string}
     */
    public function createRefreshToken(User $user, ?string $userAgent): array
    {
        return DB::transaction(function () use ($user, $userAgent) {
            User::query()->whereKey($user->id)->lockForUpdate()->first();

            RefreshToken::where('user_id', $user->id)
                ->where('expires_at', '<', now())
                ->delete();

            $keep = self::MAX_REFRESH_TOKENS - 1;
            $allIds = RefreshToken::where('user_id', $user->id)
                ->orderByDesc('created_at')
                ->pluck('id');
            $staleIds = $allIds->slice($keep)->values();

            if ($staleIds->isNotEmpty()) {
                RefreshToken::whereIn('id', $staleIds)->delete();
            }

            $plainToken = Str::random(64);

            $refreshToken = RefreshToken::create([
                'user_id' => $user->id,
                'token_hash' => hash('sha256', $plainToken),
                'user_agent' => $userAgent,
                'expires_at' => now()->addDays(self::REFRESH_TOKEN_DAYS),
            ]);

            return [$refreshToken, $plainToken];
        });
    }

    public function deleteRefreshToken(string $plainToken, User $user): void
    {
        $this->findRefreshToken($plainToken, $user->id)?->delete();
    }
}
