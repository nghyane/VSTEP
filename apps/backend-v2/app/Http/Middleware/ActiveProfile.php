<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Profile;
use Closure;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Inject active profile vào request attributes.
 *
 * JWT claim `active_profile_id` là source of truth. Middleware load profile
 * và verify ownership (belongs to authenticated user).
 *
 * Fail 401 nếu:
 * - Không có claim
 * - Profile không tồn tại
 * - Profile không thuộc account hiện tại
 *
 * Learner routes phải mount middleware này sau `auth:api`.
 * Admin/teacher routes KHÔNG mount — họ không có profile.
 */
class ActiveProfile
{
    public function handle(Request $request, Closure $next): Response
    {
        $payload = JWTAuth::parseToken()->getPayload();
        $profileId = $payload->get('active_profile_id');

        if (! is_string($profileId) || $profileId === '') {
            abort(401, 'Active profile context missing.');
        }

        /** @var Profile|null $profile */
        $profile = Profile::query()->find($profileId);

        if ($profile === null) {
            abort(401, 'Active profile not found.');
        }

        if ($profile->account_id !== $request->user()?->id) {
            abort(403, 'Active profile does not belong to authenticated user.');
        }

        $request->attributes->set('active_profile', $profile);

        return $next($request);
    }
}
