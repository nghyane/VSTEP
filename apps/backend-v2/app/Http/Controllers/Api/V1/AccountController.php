<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Self-service: đổi password của chính tài khoản đang đăng nhập.
 * Dùng được cho mọi role (learner/teacher/staff/admin) — không có
 * endpoint nào admin xem được password người khác hay của chính mình.
 */
final class AccountController extends Controller
{
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

        /** @var User $user */
        $user = $request->user();
        $user->avatar_key = $validated['avatar_key'];
        $user->avatar_url = null; // clear uploaded photo when choosing preset
        $user->save();

        return response()->json(['data' => ['avatar_key' => $user->avatar_key, 'avatar_url' => null]]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:2048', 'mimes:jpg,jpeg,png,webp'],
        ]);

        /** @var User $user */
        $user = $request->user();

        // Delete old uploaded avatar if exists
        if ($user->avatar_url) {
            $oldPath = str_replace(Storage::disk('public')->url(''), '', $user->avatar_url);
            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $url = Storage::disk('public')->url($path);

        $user->avatar_url = $url;
        $user->avatar_key = null; // clear preset when uploading photo
        $user->save();

        return response()->json(['data' => ['avatar_url' => $url, 'avatar_key' => null]]);
    }
}
