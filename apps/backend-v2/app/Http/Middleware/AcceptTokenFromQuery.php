<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Allow SSE connections to authenticate without an Authorization header.
 *
 * EventSource doesn't support custom headers. This middleware checks for:
 * 1. A cookie named "vstep_token" (preferred, secure)
 * 2. A query parameter "token" (fallback for dev/CORS-restricted environments)
 *
 * If found and no Authorization header is present, sets the header so
 * the downstream auth:api middleware can process it normally.
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
