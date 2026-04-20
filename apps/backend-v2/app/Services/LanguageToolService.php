<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * LanguageTool integration — rule-based grammar checker.
 *
 * Self-hosted Docker: erikvl87/languagetool on port 8081.
 * Returns offset-level errors with categories + replacements.
 * Deterministic: same input → same output. No hallucination.
 *
 * Env: LANGUAGETOOL_URL (default http://localhost:8081)
 */
class LanguageToolService
{
    private function baseUrl(): string
    {
        return rtrim(env('LANGUAGETOOL_URL', 'http://localhost:8081'), '/');
    }

    /**
     * Check text for grammar/spelling/style errors.
     *
     * @return array<int, array{offset: int, length: int, message: string, category: string, rule_id: string, replacements: string[]}>
     */
    public function check(string $text, string $language = 'en-US'): array
    {
        $url = $this->baseUrl().'/v2/check';

        try {
            $response = Http::asForm()
                ->timeout(10)
                ->post($url, [
                    'text' => $text,
                    'language' => $language,
                    'enabledOnly' => 'false',
                ]);

            if (! $response->successful()) {
                Log::warning('LanguageTool check failed', ['status' => $response->status()]);

                return [];
            }

            $data = $response->json();
            $matches = $data['matches'] ?? [];

            return array_map(fn (array $match) => [
                'offset' => (int) $match['offset'],
                'length' => (int) $match['length'],
                'message' => $match['message'] ?? '',
                'category' => $match['rule']['category']['name'] ?? 'Unknown',
                'rule_id' => $match['rule']['id'] ?? '',
                'replacements' => array_slice(
                    array_map(fn ($r) => $r['value'], $match['replacements'] ?? []),
                    0,
                    3,
                ),
            ], $matches);
        } catch (\Throwable $e) {
            Log::warning('LanguageTool unavailable', ['error' => $e->getMessage()]);

            return [];
        }
    }

    /**
     * Convert LanguageTool matches to grading annotations format.
     *
     * @return array<int, array{start: int, end: int, severity: string, category: string, message: string, suggestion: string|null}>
     */
    public function toAnnotations(string $text, array $matches): array
    {
        return array_map(fn (array $m) => [
            'start' => $m['offset'],
            'end' => $m['offset'] + $m['length'],
            'severity' => $this->mapSeverity($m['category']),
            'category' => strtolower(str_replace(' ', '_', $m['category'])),
            'message' => $m['message'],
            'suggestion' => $m['replacements'][0] ?? null,
        ], $matches);
    }

    public function isAvailable(): bool
    {
        try {
            $response = Http::timeout(2)->get($this->baseUrl().'/v2/languages');

            return $response->successful();
        } catch (\Throwable) {
            return false;
        }
    }

    private function mapSeverity(string $category): string
    {
        return match (true) {
            str_contains(strtolower($category), 'grammar') => 'error',
            str_contains(strtolower($category), 'typo') => 'error',
            str_contains(strtolower($category), 'punctuation') => 'suggestion',
            str_contains(strtolower($category), 'style') => 'suggestion',
            default => 'error',
        };
    }
}
