<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\Role;
use App\Exceptions\GoogleAccountConflictException;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

final class AuthService
{
    public function __construct(
        private readonly ProfileService $profileService,
        private readonly TokenService $tokenService,
    ) {}

    /**
     * Register account + initial profile in single transaction.
     *
     * @param  array{email:string,password:string}  $accountData
     * @param  array{nickname:string,target_level:string,target_deadline:string,entry_level?:string|null}  $profileData
     * @return array{user:User,profile:Profile}
     */
    public function register(array $accountData, array $profileData): array
    {
        $result = DB::transaction(function () use ($accountData, $profileData) {
            $user = User::create([
                ...$accountData,
                'role' => Role::Learner,
            ]);

            $profile = $this->profileService->createInitialProfile($user, $profileData);
            $this->persistActiveProfile($user, $profile);

            return [
                'user' => $user,
                'profile' => $profile,
            ];
        });

        $result['user']->sendEmailVerificationNotification();

        return $result;
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
        if (! $user->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'email' => ['Vui lòng xác thực email trước khi đăng nhập.'],
            ]);
        }
        $profile = $this->resolveActiveProfile($user);
        $this->persistActiveProfile($user, $profile);
        $accessToken = $this->tokenService->issueAccessToken($user, $profile);
        [, $plainToken] = $this->tokenService->createRefreshToken($user, $userAgent);

        return [
            'user' => $user,
            'profile' => $profile,
            'access_token' => $accessToken,
            'refresh_token' => $plainToken,
            'expires_in' => config('jwt.ttl') * 60,
        ];
    }

    public function sendPasswordResetLink(string $email): void
    {
        $user = User::query()->where('email', $email)->first();
        if ($user !== null && $user->password === null) {
            throw ValidationException::withMessages([
                'email' => ['Tài khoản này đăng nhập bằng Google. Vui lòng dùng nút đăng nhập Google.'],
            ]);
        }

        $status = Password::sendResetLink(['email' => $email]);

        if ($status === Password::RESET_LINK_SENT || $status === Password::INVALID_USER) {
            return;
        }

        if ($status === Password::RESET_THROTTLED) {
            throw ValidationException::withMessages([
                'email' => ['Email đặt lại mật khẩu vừa được gửi. Vui lòng chờ trước khi gửi lại.'],
            ]);
        }

        throw ValidationException::withMessages([
            'email' => ['Không gửi được email đặt lại mật khẩu. Vui lòng thử lại sau.'],
        ]);
    }

    public function resetPassword(string $email, string $token, string $password, string $passwordConfirmation): void
    {
        $user = User::query()->where('email', $email)->first();
        if ($user !== null && $user->password === null) {
            throw ValidationException::withMessages([
                'email' => ['Tài khoản này đăng nhập bằng Google. Vui lòng dùng nút đăng nhập Google.'],
            ]);
        }

        $status = Password::reset(
            [
                'email' => $email,
                'token' => $token,
                'password' => $password,
                'password_confirmation' => $passwordConfirmation,
            ],
            function (User $user, string $password): void {
                $user->forceFill(['password' => Hash::make($password)])->save();
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => ['Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'],
            ]);
        }
    }

    public function verifyEmail(string $userId, string $hash): User
    {
        $user = User::query()->find($userId);
        if ($user === null || ! hash_equals($hash, sha1($user->getEmailForVerification()))) {
            throw ValidationException::withMessages([
                'email' => ['Liên kết xác thực email không hợp lệ.'],
            ]);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return $user;
    }

    public function resendEmailVerification(string $email): void
    {
        $user = User::query()->where('email', $email)->first();
        if ($user === null) {
            // Match password reset behavior: do not expose whether an email exists.
            return;
        }
        if ($user->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'email' => ['Email này đã được xác thực. Vui lòng đăng nhập.'],
            ]);
        }

        $user->sendEmailVerificationNotification();
    }

    /**
     * @return array{
     *     access_token: string,
     *     refresh_token: string,
     *     expires_in: int,
     *     user: User,
     *     profile: Profile|null,
     * }
     */
    public function refresh(string $plainToken, ?string $userAgent = null): array
    {
        $refreshToken = $this->tokenService->findRefreshToken($plainToken);

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
        [, $newPlainToken] = $this->tokenService->createRefreshToken($user, $userAgent);

        // Đọc active profile đã persist trước; fallback về default chỉ khi user chưa từng switch.
        $profile = $this->resolveActiveProfile($user);
        $this->persistActiveProfile($user, $profile);
        $accessToken = $this->tokenService->issueAccessToken($user, $profile);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $newPlainToken,
            'expires_in' => config('jwt.ttl') * 60,
            'user' => $user,
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

        $oldToken = $this->tokenService->findRefreshToken($oldRefreshToken, $user->id);
        $oldToken?->delete();

        $this->persistActiveProfile($user, $profile);

        // Invalidate current JWT (access token cũ vẫn carry active_profile_id cũ).
        // Sau switch, FE phải dùng access token mới — token cũ blacklist ngay.
        if (JWTAuth::getToken()) {
            JWTAuth::invalidate(JWTAuth::getToken());
        }

        [, $newPlainToken] = $this->tokenService->createRefreshToken($user, $userAgent);
        $accessToken = $this->tokenService->issueAccessToken($user, $profile);

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
    public function loginWithGoogle(
        string $idToken,
        GoogleTokenVerifier $googleTokenVerifier,
        ?string $userAgent = null,
    ): array {
        $payload = $googleTokenVerifier->verify($idToken);

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
            $accessToken = $this->tokenService->issueAccessToken($user, $profile);
            [, $plainToken] = $this->tokenService->createRefreshToken($user, $userAgent);

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
            $accessToken = $this->tokenService->issueAccessToken($user, $profile);

            return [
                'profile' => $profile,
                'access_token' => $accessToken,
                'expires_in' => config('jwt.ttl') * 60,
            ];
        });
    }

    public function logout(string $plainToken, User $user): void
    {
        $refreshToken = $this->tokenService->findRefreshToken($plainToken, $user->id);
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
}
