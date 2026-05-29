<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Allow SSE connections to pass the Bearer token via ?token= query parameter.
 * EventSource doesn't support custom headers.
 */
final class AcceptTokenFromQuery
{
    public function handle(Request $request, Closure $next): mixed
    {
        $token = $request->query('token');
        if ($token !== null && $request->header('Authorization') === null) {
            $request->headers->set('Authorization', "Bearer $token");
        }

        return $next($request);
    }
}
