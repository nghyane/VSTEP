<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangePasswordRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;

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
}
