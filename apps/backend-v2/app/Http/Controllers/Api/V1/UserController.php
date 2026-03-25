<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\ChangePasswordRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Requests\User\UploadAvatarRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Routing\Attributes\Controllers\Authorize;

class UserController extends Controller
{
    public function __construct(
        private readonly UserService $service,
    ) {}

    #[Authorize('view', 'user')]
    public function show(User $user)
    {
        return new UserResource($user);
    }

    #[Authorize('update', 'user')]
    public function update(UpdateUserRequest $request, User $user)
    {
        $user = $this->service->update($user, $request->validated());

        return new UserResource($user);
    }

    #[Authorize('update', 'user')]
    public function changePassword(ChangePasswordRequest $request, User $user)
    {
        $this->service->changePassword(
            $user,
            $request->validated('current_password'),
            $request->validated('new_password'),
        );

        return response()->json(['data' => ['success' => true]]);
    }

    #[Authorize('update', 'user')]
    public function uploadAvatar(UploadAvatarRequest $request, User $user)
    {
        $path = $request->file('avatar')->store('avatars', 'public');
        $user = $this->service->update($user, ['avatar_key' => $path]);

        return response()->json(['data' => ['avatar_key' => $user->avatar_key]]);
    }
}
