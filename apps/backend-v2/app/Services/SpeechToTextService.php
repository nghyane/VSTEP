<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Azure Speech-to-Text service.
 *
 * Uses Azure Cognitive Services Speech REST API (batch or real-time).
 * Phase 1: simple REST endpoint for short audio (< 60s segments).
 * Phase 2: batch transcription for longer audio.
 *
 * Env: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION (default: southeastasia).
 */
class SpeechToTextService
{
    private function key(): string
    {
        return config('services.azure_speech.key', env('AZURE_SPEECH_KEY', ''));
    }

    private function region(): string
    {
        return config('services.azure_speech.region', env('AZURE_SPEECH_REGION', 'southeastasia'));
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
            Log::warning('SpeechToTextService: AZURE_SPEECH_KEY not configured, returning mock.');

            return $this->mockTranscribe();
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

    /**
     * @return array{text: string, confidence: float, duration_ms: int}
     */
    private function mockTranscribe(): array
    {
        return [
            'text' => 'Mock transcript from Azure Speech-to-Text.',
            'confidence' => 0.85,
            'duration_ms' => 5000,
        ];
    }
}
