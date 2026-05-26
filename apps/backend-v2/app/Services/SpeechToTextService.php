<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Azure Speech-to-Text service.
 *
 * Uses Azure Cognitive Services Speech REST API in detailed mode.
 * Extracts: text, confidence, duration_ms, word_count, pause_count, speaking_rate.
 *
 * Requires: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION.
 * Interface: SpeechToText — swappable with other providers.
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
     * Transcribe audio content (binary) to text with timing data.
     *
     * @param  string  $audioContent  Raw audio bytes (WAV/WebM/OGG)
     * @param  string  $language  BCP-47 language tag
     * @return array{text: string, confidence: float, duration_ms: int, word_count: int, pause_count: int, speaking_rate: float}|null
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
                    'pronunciationAssessment' => json_encode([
                        'GradingSystem' => 'FivePoint',
                        'Granularity' => 'Word',
                        'EnableMiscue' => true,
                    ]),
                ])
                ->withBody($audioContent, 'audio/webm; codecs=opus')
                ->timeout(30)
                ->post($endpoint);

            if (! $response->successful()) {
                // Retry with WAV content type (fallback for WAV audio)
                $response = Http::withHeaders([
                    'Ocp-Apim-Subscription-Key' => $key,
                    'Content-Type' => 'audio/wav',
                    'Accept' => 'application/json',
                ])
                    ->withQueryParameters([
                        'language' => $language,
                        'format' => 'detailed',
                        'pronunciationAssessment' => json_encode([
                            'GradingSystem' => 'FivePoint',
                            'Granularity' => 'Word',
                            'EnableMiscue' => true,
                        ]),
                    ])
                    ->withBody($audioContent, 'audio/wav')
                    ->timeout(30)
                    ->post($endpoint);
            }

            if (! $response->successful()) {
                Log::error('Azure STT failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $data = $response->json();
            $best = $data['NBest'][0] ?? null;
            $durationMs = (int) ($data['Duration'] ?? 0) / 10_000;

            // Pronunciation assessment scores (Azure built-in)
            $pronAssessment = $best['PronunciationAssessment'] ?? null;
            $pronScores = $pronAssessment !== null ? [
                'accuracy' => (float) ($pronAssessment['AccuracyScore'] ?? 0) / 100 * 10,
                'fluency' => (float) ($pronAssessment['FluencyScore'] ?? 0) / 100 * 10,
                'prosody' => (float) ($pronAssessment['ProsodyScore'] ?? 0) / 100 * 10,
                'overall' => (float) ($pronAssessment['PronScore'] ?? 0) / 100 * 10,
            ] : null;

            // Word-level timing: detect pauses between words (>500ms gap = pause)
            $words = $best['Words'] ?? $data['Words'] ?? [];
            $wordCount = count($words);
            $pauseCount = 0;
            for ($i = 1; $i < $wordCount; $i++) {
                $prevEnd = ($words[$i - 1]['Offset'] ?? 0) + ($words[$i - 1]['Duration'] ?? 0);
                $currStart = $words[$i]['Offset'] ?? 0;
                if (($currStart - $prevEnd) > 50_000) { // 50ms in 100ns ticks
                    $pauseCount++;
                }
            }

            // Speaking rate: words per minute
            $speakingRate = $durationMs > 0 ? ($wordCount / ($durationMs / 1000)) * 60 : 0;

            return [
                'text' => $data['DisplayText'] ?? $best['Display'] ?? '',
                'confidence' => (float) ($best['Confidence'] ?? 0),
                'duration_ms' => $durationMs,
                'word_count' => $wordCount,
                'pause_count' => $pauseCount,
                'speaking_rate' => round($speakingRate, 1),
                'pronunciation' => $pronScores,
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
