<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Azure Speech-to-Text service.
 *
 * Uses Azure Cognitive Services Speech REST API.
 * Throws RuntimeException when AZURE_SPEECH_KEY is not configured —
 * no mock fallback. Use FakeSpeechToText for tests.
 *
 * Env: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION (default: southeastasia).
 */
final class SpeechToTextService implements SpeechToText
{
    private function key(): string
    {
        return (string) config('services.azure_speech.key');
    }

    private function region(): string
    {
        return (string) config('services.azure_speech.region');
    }

    /**
     * Transcribe audio content (binary) to text.
     *
     * @param  string  $audioContent  Raw audio bytes (WAV/WebM/OGG)
     * @param  string  $language  BCP-47 language tag
     * @return array{text: string, confidence: float, duration_ms: int}|null null on failure
     */
    public function transcribe(string $audioContent, string $language = 'en-US'): ?array
    {
        $key = $this->key();
        if ($key === '') {
            throw new \RuntimeException('AZURE_SPEECH_KEY is not configured. Speech-to-text cannot run without Azure credentials.');
        }

        $region = $this->region();
        $endpoint = "https://{$region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1";

        try {
            $response = Http::withHeaders([
                'Ocp-Apim-Subscription-Key' => $key,
                'Content-Type' => 'audio/webm; codecs=opus',
                'Accept' => 'application/json',
            ])
                ->withQueryParameters([
                    'language' => $language,
                    'format' => 'detailed',
                ])
                ->withBody($audioContent, 'audio/webm; codecs=opus')
                ->timeout(30)
                ->post($endpoint);

            if (! $response->successful()) {
                Log::error('Azure STT failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $data = $response->json();
            $best = $data['NBest'][0] ?? null;

            return [
                'text' => $data['DisplayText'] ?? $best['Display'] ?? '',
                'confidence' => (float) ($best['Confidence'] ?? 0),
                'duration_ms' => (int) ($data['Duration'] ?? 0) / 10_000, // 100ns ticks → ms
            ];
        } catch (\Throwable $e) {
            Log::error('Azure STT exception', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Transcribe from R2 audio key (download + transcribe).
     */
    public function transcribeFromStorage(string $audioKey, AudioStorageService $storage): ?array
    {
        try {
            $content = $storage->getContent($audioKey);

            return $this->transcribe($content);
        } catch (\Throwable $e) {
            Log::error('STT from storage failed', ['key' => $audioKey, 'error' => $e->getMessage()]);

            return null;
        }
    }
}
