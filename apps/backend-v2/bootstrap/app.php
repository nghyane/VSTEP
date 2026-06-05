<?php

use App\Http\Middleware\ActiveProfile;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\JsonUtf8;
use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Routing\Exceptions\InvalidSignatureException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => CheckRole::class,
            'active-profile' => ActiveProfile::class,
        ]);

        $middleware->append(JsonUtf8::class);

        // API-only app. Disable the default web "redirect to login" behaviour
        // so Authenticate middleware never calls route('login') (which doesn't
        // exist) when the client forgot to send Accept: application/json.
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*'));

        // API auth → return 401 JSON instead of redirecting to non-existent "login" route
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            return null;
        });

        $exceptions->render(function (InvalidSignatureException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            $frontendUrl = rtrim((string) config('app.frontend_url'), '/');
            if ($request->is('api/v1/auth/email/verify/*')) {
                $userId = $request->route('id');
                $user = is_string($userId) ? User::query()->find($userId) : null;

                if ($user?->hasVerifiedEmail()) {
                    if ($request->expectsJson()) {
                        return response()->json(['data' => ['success' => true]]);
                    }

                    return redirect()->away($frontendUrl.'/?'.http_build_query([
                        'auth' => 'email-verified',
                    ]));
                }
            }

            $message = 'Liên kết xác thực email không hợp lệ hoặc đã hết hạn.';
            if ($request->expectsJson()) {
                return response()->json(['message' => $message], 403);
            }

            return redirect()->away($frontendUrl.'/?'.http_build_query([
                'auth' => 'email-verification-invalid',
            ]));
        });

        // Clean 404 — hide model class names and stack traces
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            $previous = $e->getPrevious();
            if ($previous instanceof ModelNotFoundException) {
                $model = class_basename($previous->getModel());

                return response()->json(['message' => "{$model} not found."], 404);
            }

            return response()->json(['message' => 'Not found.'], 404);
        });
    })->create();
