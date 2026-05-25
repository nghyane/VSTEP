<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Circuit breaker for AI endpoints.
 *
 * Tracks failures in a sliding window. After 5 failures in 60 seconds,
 * rejects all requests for 30 seconds (returns 503 immediately).
 * Prevents cascading failures when AI provider is degraded.
 */
final class AiCircuitBreaker
{
    private const FAILURE_THRESHOLD = 5;

    private const WINDOW_SECONDS = 60;

    private const COOLDOWN_SECONDS = 30;

    public function handle(Request $request, Closure $next): Response
    {
        $cacheKey = 'ai_circuit_breaker:open';

        if (Cache::has($cacheKey)) {
            return response()->json([
                'message' => 'AI service temporarily unavailable due to repeated failures.',
                'retry_after' => self::COOLDOWN_SECONDS,
            ], 503);
        }

        $response = $next($request);

        if ($response->getStatusCode() >= 500) {
            $this->recordFailure($cacheKey);
        }

        return $response;
    }

    private function recordFailure(string $cacheKey): void
    {
        $failures = (int) Cache::get('ai_circuit_breaker:failures', 0) + 1;
        Cache::put('ai_circuit_breaker:failures', $failures, self::WINDOW_SECONDS);

        if ($failures >= self::FAILURE_THRESHOLD) {
            Cache::put($cacheKey, true, self::COOLDOWN_SECONDS);
            Cache::forget('ai_circuit_breaker:failures');
        }
    }
}
