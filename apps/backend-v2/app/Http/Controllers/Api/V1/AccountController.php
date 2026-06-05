<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Http\Requests\Profile\UpdateAvatarRequest;
use App\Http\Requests\Profile\UploadAvatarRequest;
use App\Http\Resources\AvatarResource;
use App\Models\User;
use App\Services\AccountService;
use App\Services\ProfileService;
use Illuminate\Http\JsonResponse;

/**
 * Self-service: đổi password của chính tài khoản đang đăng nhập.
 * Dùng được cho mọi role (learner/teacher/staff/admin) — không có
 * endpoint nào admin xem được password người khác hay của chính mình.
 */
final class AccountController extends Controller
{
    public function __construct(
        private readonly AccountService $accountService,
        private readonly ProfileService $profileService,
    ) {}

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->accountService->changePassword($user, $request->string('new_password')->toString());

        return response()->json(['data' => ['success' => true]]);
    }

    public function updateAvatar(UpdateAvatarRequest $request): JsonResponse
    {
        $profile = $this->profileService->chooseAvatar(
            $request->profile(),
            (string) $request->validated('avatar_key'),
        );

        return (new AvatarResource($profile))->response();
    }

    public function uploadAvatar(UploadAvatarRequest $request): JsonResponse
    {
        $profile = $this->profileService->uploadAvatar($request->profile(), $request->file('avatar'));

        return (new AvatarResource($profile))->response();
    }
}
