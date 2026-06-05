<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

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
        return rtrim((string) config('services.languagetool.url'), '/');
    }

    /**
     * Check text for grammar/spelling/style errors.
     *
     * @return array<int, array{offset: int, length: int, message: string, category: string, rule_id: string, replacements: string[]}>
     *
     * @throws \RuntimeException if LanguageTool is unreachable
     */
    public function check(string $text, string $language = 'en-US'): array
    {
        $url = $this->baseUrl().'/v2/check';

        $response = Http::asForm()
            ->timeout(10)
            ->connectTimeout(3)
            ->post($url, [
                'text' => $text,
                'language' => $language,
                'enabledOnly' => 'false',
            ]);

        if (! $response->successful()) {
            throw new \RuntimeException(
                "LanguageTool returned HTTP {$response->status()}",
            );
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
    }

    /**
     * Speaking transcripts should not be penalized for casing, typography,
     * punctuation or style suggestions caused by ASR/transcription format.
     *
     * @return array<int, array{offset: int, length: int, message: string, category: string, rule_id: string, replacements: string[]}>
     */
    public function checkSpeakingTranscript(string $text, string $language = 'en-US'): array
    {
        return array_values(array_filter(
            $this->check($text, $language),
            fn (array $match): bool => $this->isSpeakingGrammarSignal((string) $match['category']),
        ));
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
            'category' => Str::lower(Str::replace(' ', '_', $m['category'])),
            'message' => $m['message'],
            'suggestion' => $m['replacements'][0] ?? null,
        ], $matches);
    }

    private function mapSeverity(string $category): string
    {
        $cat = Str::lower($category);

        return match (true) {
            Str::contains($cat, 'grammar') => 'error',
            Str::contains($cat, 'typo') => 'error',
            Str::contains($cat, 'punctuation') => 'suggestion',
            Str::contains($cat, 'style') => 'suggestion',
            default => 'error',
        };
    }

    private function isSpeakingGrammarSignal(string $category): bool
    {
        $cat = Str::lower($category);

        return Str::contains($cat, 'grammar')
            || Str::contains($cat, 'typo')
            || Str::contains($cat, 'confused');
    }
}
