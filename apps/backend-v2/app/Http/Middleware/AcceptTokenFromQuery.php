<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Accept Bearer token from cookie or query parameter.
 *
 * Same-origin (production / Vite proxy): browser sends vstep_token cookie automatically.
 * Cross-origin (direct API calls): fallback to ?token= query parameter.
 */
final class AcceptTokenFromQuery
{
    public function handle(Request $request, Closure $next): mixed
    {
        if ($request->header('Authorization') !== null) {
            return $next($request);
        }

        $token = $request->cookie('vstep_token') ?? $request->query('token');

        if ($token !== null) {
            $request->headers->set('Authorization', "Bearer $token");
        }

        return $next($request);
    }
}
