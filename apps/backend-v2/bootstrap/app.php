<?php

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
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
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*'));

        // Clean 404 — hide model class names and stack traces
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if (!$request->is('api/*')) return null;

            $previous = $e->getPrevious();
            if ($previous instanceof ModelNotFoundException) {
                $model = class_basename($previous->getModel());
                return response()->json(['message' => "{$model} not found."], 404);
            }

            return response()->json(['message' => 'Not found.'], 404);
        });
    })->create();
