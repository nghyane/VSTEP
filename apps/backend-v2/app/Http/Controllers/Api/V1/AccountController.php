<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Services\ProfileService;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Self-service: đổi password của chính tài khoản đang đăng nhập.
 * Dùng được cho mọi role (learner/teacher/staff/admin) — không có
 * endpoint nào admin xem được password người khác hay của chính mình.
 */
final class AccountController extends Controller
{
    public function __construct(
        private readonly ProfileService $profileService,
    ) {}

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->password = $request->string('new_password')->toString(); // model cast 'hashed'
        $user->save();

        return response()->json(['data' => ['success' => true]]);
    }

    public function updateAvatar(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'avatar_key' => ['required', 'string', 'in:Alex,Jordan,Sam,Riley,Casey,Morgan,Taylor,Drew,Quinn,Avery,Blake,Cameron,Dakota,Emery,Finley,Hayden,Indigo,Jesse,Kai,Logan,Mason,Noah,Oakley,Parker,Reese,Sage,Skyler,Tatum,Winter,Zion'],
        ]);

        $profile = $this->profileService->chooseAvatar($request->profile(), $validated['avatar_key']);

        return response()->json(['data' => ['avatar_key' => $profile->avatar_key, 'avatar_url' => null]]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:2048', 'mimes:jpg,jpeg,png,webp'],
        ]);

        $profile = $this->profileService->uploadAvatar($request->profile(), $request->file('avatar'));

        return response()->json(['data' => ['avatar_url' => $profile->avatar_url, 'avatar_key' => null]]);
    }
}
