<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $required = Role::from($role);

        if (! $request->user()?->role->is($required)) {
            abort(403, 'Insufficient permissions.');
        }

        return $next($request);
    }
}
