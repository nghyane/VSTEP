<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\Role;
use App\Exceptions\GoogleAccountConflictException;
use App\Models\Profile;
use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

final class AuthService
{
    private const MAX_REFRESH_TOKENS = 3;

    private const REFRESH_TOKEN_DAYS = 30;

    public function __construct(
        private readonly ProfileService $profileService,
        private readonly GoogleTokenVerifier $googleTokenVerifier,
    ) {}

    /**
     * Register account + initial profile in single transaction.
     *
     * @param  array{email:string,password:string}  $accountData
     * @param  array{nickname:string,target_level:string,target_deadline:string,entry_level?:string|null}  $profileData
     * @return array{user:User,profile:Profile,access_token:string,refresh_token:string,expires_in:int}
     */
    public function register(array $accountData, array $profileData): array
    {
        return DB::transaction(function () use ($accountData, $profileData) {
            $user = User::create([
                ...$accountData,
                'role' => Role::Learner,
                'email_verified_at' => now(),
            ]);

            $profile = $this->profileService->createInitialProfile($user, $profileData);

            $accessToken = $this->issueAccessToken($user, $profile);
            [, $plainToken] = $this->createRefreshToken($user, null);

            return [
                'user' => $user,
                'profile' => $profile,
                'access_token' => $accessToken,
                'refresh_token' => $plainToken,
                'expires_in' => config('jwt.ttl') * 60,
            ];
        });
    }

    /**
     * @return array{
     *     user: User,
     *     profile: Profile|null,
     *     access_token: string,
     *     refresh_token: string,
     *     expires_in: int,
     * }
     */
    public function login(string $email, string $password, ?string $userAgent = null): array
    {
        if (! JWTAuth::attempt(['email' => $email, 'password' => $password])) {
            throw ValidationException::withMessages([
                'email' => ['Email hoặc mật khẩu không đúng.'],
            ]);
        }

        /** @var User $user */
        $user = JWTAuth::user();
        if ($user->isDeactivated()) {
            // Trả message qua field email để FE hiện chung 1 ô lỗi giống login fail.
            throw ValidationException::withMessages([
                'email' => ['Tài khoản đã bị vô hiệu hoá. Liên hệ quản trị viên để được hỗ trợ.'],
            ]);
        }
        $profile = $this->resolveActiveProfile($user);
        $this->persistActiveProfile($user, $profile);
        $accessToken = $this->issueAccessToken($user, $profile);
        [, $plainToken] = $this->createRefreshToken($user, $userAgent);

        return [
            'user' => $user,
            'profile' => $profile,
            'access_token' => $accessToken,
            'refresh_token' => $plainToken,
            'expires_in' => config('jwt.ttl') * 60,
        ];
    }

    /**
     * @return array{
     *     access_token: string,
     *     refresh_token: string,
     *     expires_in: int,
     *     profile: Profile|null,
     * }
     */
    public function refresh(string $plainToken, ?string $userAgent = null): array
    {
        $refreshToken = $this->findRefreshToken($plainToken);

        if (! $refreshToken || $refreshToken->isExpired()) {
            $refreshToken?->delete();

            throw ValidationException::withMessages([
                'refresh_token' => ['Invalid or expired refresh token.'],
            ]);
        }

        /** @var User $user */
        $user = $refreshToken->user;
        if ($user->isDeactivated()) {
            // Refresh token còn TTL nhưng account đã bị vô hiệu hoá → revoke session.
            $refreshToken->delete();

            throw ValidationException::withMessages([
                'refresh_token' => ['Tài khoản đã bị vô hiệu hoá.'],
            ]);
        }

        $refreshToken->delete();
        [, $newPlainToken] = $this->createRefreshToken($user, $userAgent);

        // Đọc active profile đã persist trước; fallback về default chỉ khi user chưa từng switch.
        $profile = $this->resolveActiveProfile($user);
        $accessToken = $this->issueAccessToken($user, $profile);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $newPlainToken,
            'expires_in' => config('jwt.ttl') * 60,
            'profile' => $profile,
        ];
    }

    /**
     * Switch active profile. Reissue JWT with new claim + rotate refresh token.
     *
     * @return array{
     *     access_token: string,
     *     refresh_token: string,
     *     expires_in: int,
     *     profile: Profile,
     * }
     */
    public function switchProfile(
        User $user,
        string $profileId,
        string $oldRefreshToken,
        ?string $userAgent = null,
    ): array {
        $profile = Profile::query()
            ->where('account_id', $user->id)
            ->where('id', $profileId)
            ->first();

        if ($profile === null) {
            throw ValidationException::withMessages([
                'profile_id' => ['Profile not found or not owned by account.'],
            ]);
        }

        $oldToken = $this->findRefreshToken($oldRefreshToken, $user->id);
        $oldToken?->delete();

        $this->persistActiveProfile($user, $profile);

        // Invalidate current JWT (access token cũ vẫn carry active_profile_id cũ).
        // Sau switch, FE phải dùng access token mới — token cũ blacklist ngay.
        if (JWTAuth::getToken()) {
            JWTAuth::invalidate(JWTAuth::getToken());
        }

        [, $newPlainToken] = $this->createRefreshToken($user, $userAgent);
        $accessToken = $this->issueAccessToken($user, $profile);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $newPlainToken,
            'expires_in' => config('jwt.ttl') * 60,
            'profile' => $profile,
        ];
    }

    /**
     * Authenticate with a Google ID token. Creates user on first sign-in.
     * Initial profile is NOT auto-created: frontend must call completeOnboarding
     * when needs_onboarding=true.
     *
     * @return array{
     *     user: User,
     *     profile: Profile|null,
     *     access_token: string,
     *     refresh_token: string,
     *     expires_in: int,
     *     needs_onboarding: bool,
     *     suggested_nickname: ?string,
     * }
     */
    public function loginWithGoogle(string $idToken, ?string $userAgent = null): array
    {
        $payload = $this->googleTokenVerifier->verify($idToken);

        if (! $payload['email_verified']) {
            throw ValidationException::withMessages([
                'id_token' => ['Email chưa được Google xác minh.'],
            ]);
        }

        // User::$email is mutated to lowercase on write, so equality on the
        // raw token email matches every existing row. No whereRaw, no extra
        // normalization layer here \u2014 the canonical form lives in the model.
        return DB::transaction(function () use ($payload, $userAgent) {
            $user = User::where('google_id', $payload['sub'])->first();

            if ($user === null) {
                $existing = User::where('email', $payload['email'])->first();

                if ($existing !== null && $existing->email_verified_at === null) {
                    // Account takeover prevention: email đã đăng ký nhưng chưa verify.
                    // Attacker có thể tạo Google account với email của victim để chiếm tài khoản.
                    throw new GoogleAccountConflictException;
                }

                if ($existing !== null) {
                    // Verified account — link Google ID.
                    $user = $existing;
                    $user->google_id = $payload['sub'];
                    if ($user->full_name === null && $payload['name'] !== null) {
                        $user->full_name = $payload['name'];
                    }
                    $user->save();
                } else {
                    // New user. Google đã verify email — mark verified.
                    $user = User::create([
                        'email' => $payload['email'],
                        'google_id' => $payload['sub'],
                        'full_name' => $payload['name'],
                        'role' => Role::Learner,
                        'email_verified_at' => now(),
                    ]);
                }
            }

            if ($user->isDeactivated()) {
                throw ValidationException::withMessages([
                    'id_token' => ['Tài khoản đã bị vô hiệu hoá. Liên hệ quản trị viên để được hỗ trợ.'],
                ]);
            }

            $profile = $this->resolveActiveProfile($user);
            $this->persistActiveProfile($user, $profile);
            $accessToken = $this->issueAccessToken($user, $profile);
            [, $plainToken] = $this->createRefreshToken($user, $userAgent);

            return [
                'user' => $user,
                'profile' => $profile,
                'access_token' => $accessToken,
                'refresh_token' => $plainToken,
                'expires_in' => config('jwt.ttl') * 60,
                'needs_onboarding' => $user->role === Role::Learner && $profile === null,
                'suggested_nickname' => $payload['name'],
            ];
        });
    }

    /**
     * Create initial profile for an already-authenticated user (Google signup flow).
     * Issues a fresh access token carrying the new active_profile_id.
     *
     * @param  array{nickname:string,target_level:string,target_deadline:string,entry_level?:string|null}  $profileData
     * @return array{
     *     profile: Profile,
     *     access_token: string,
     *     expires_in: int,
     * }
     */
    public function completeOnboarding(User $user, array $profileData): array
    {
        if ($user->initialProfile() !== null) {
            throw ValidationException::withMessages([
                'profile' => ['Tài khoản đã hoàn tất onboarding.'],
            ]);
        }

        return DB::transaction(function () use ($user, $profileData) {
            $profile = $this->profileService->createInitialProfile($user, $profileData);
            $this->persistActiveProfile($user, $profile);
            $accessToken = $this->issueAccessToken($user, $profile);

            return [
                'profile' => $profile,
                'access_token' => $accessToken,
                'expires_in' => config('jwt.ttl') * 60,
            ];
        });
    }

    public function logout(string $plainToken, User $user): void
    {
        $refreshToken = $this->findRefreshToken($plainToken, $user->id);
        $refreshToken?->delete();

        JWTAuth::invalidate(JWTAuth::getToken());
    }

    /**
     * Default profile for login/refresh: initial profile if exists, else first.
     * Admin/teacher return null.
     */
    private function resolveDefaultProfile(User $user): ?Profile
    {
        if ($user->role !== Role::Learner) {
            return null;
        }

        return $user->initialProfile()
            ?? $user->profiles()->orderBy('created_at')->first();
    }

    /**
     * Active profile cho /refresh: ưu tiên profile đã persist trên users.active_profile_id
     * (set khi switchProfile hoặc onboarding); fall back về default nếu user chưa từng switch
     * hoặc profile cũ đã bị xoá (FK nullOnDelete đã set null sẵn).
     */
    private function resolveActiveProfile(User $user): ?Profile
    {
        if ($user->role !== Role::Learner) {
            return null;
        }

        if ($user->active_profile_id !== null) {
            $active = $user->activeProfile()->first();
            if ($active !== null) {
                return $active;
            }
        }

        return $this->resolveDefaultProfile($user);
    }

    private function persistActiveProfile(User $user, ?Profile $profile): void
    {
        if ($user->active_profile_id === ($profile?->id)) {
            return;
        }

        $user->update(['active_profile_id' => $profile?->id]);
    }

    private function issueAccessToken(User $user, ?Profile $profile): string
    {
        $claims = [
            'role' => $user->role->value,
            'active_profile_id' => $profile?->id,
        ];

        return JWTAuth::claims($claims)->fromUser($user);
    }

    private function findRefreshToken(string $plainToken, ?string $userId = null): ?RefreshToken
    {
        $hash = hash('sha256', $plainToken);
        $query = RefreshToken::query()->where('token_hash', $hash);
        if ($userId !== null) {
            $query->where('user_id', $userId);
        }

        return $query->first();
    }

    /**
     * @return array{0: RefreshToken, 1: string}
     */
    private function createRefreshToken(User $user, ?string $userAgent): array
    {
        return DB::transaction(function () use ($user, $userAgent) {
            // Lock user row to serialize concurrent token issuance.
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
}
