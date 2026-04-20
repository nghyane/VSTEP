<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * NLP Sidecar client — calls Python FastAPI service for:
 * - GECToR grammar error detection (token-level)
 * - CEFR level prediction
 *
 * Graceful fallback: returns empty/null when sidecar unavailable.
 * Env: NLP_SIDECAR_URL (default http://localhost:8082)
 */
class NlpSidecarService
{
    private function baseUrl(): string
    {
        return rtrim(env('NLP_SIDECAR_URL', 'http://localhost:8082'), '/');
    }

    /**
     * GECToR grammar check — token-level errors.
     *
     * @return array<int, array{token: string, position: int, tag: string, correction: string|null, error_type: string|null}>
     */
    public function grammarCheck(string $text): array
    {
        try {
            $response = Http::timeout(15)
                ->post($this->baseUrl().'/grammar/check', [
                    'text' => $text,
                ]);

            if (! $response->successful()) {
                Log::warning('NLP sidecar grammar check failed', ['status' => $response->status()]);

                return [];
            }

            return $response->json('errors', []);
        } catch (\Throwable $e) {
            Log::warning('NLP sidecar unavailable (grammar)', ['error' => $e->getMessage()]);

            return [];
        }
    }

    /**
     * CEFR level prediction.
     *
     * @return array{predicted_level: string, confidence: float, all_levels: array<string, float>}|null
     */
    public function predictCefrLevel(string $text): ?array
    {
        try {
            $response = Http::timeout(10)
                ->post($this->baseUrl().'/cefr/predict', [
                    'text' => $text,
                ]);

            if (! $response->successful()) {
                Log::warning('NLP sidecar CEFR predict failed', ['status' => $response->status()]);

                return null;
            }

            return $response->json();
        } catch (\Throwable $e) {
            Log::warning('NLP sidecar unavailable (CEFR)', ['error' => $e->getMessage()]);

            return null;
        }
    }

    public function isAvailable(): bool
    {
        try {
            $response = Http::timeout(2)->get($this->baseUrl().'/health');

            return $response->successful() && $response->json('status') === 'ok';
        } catch (\Throwable) {
            return false;
        }
    }
}
