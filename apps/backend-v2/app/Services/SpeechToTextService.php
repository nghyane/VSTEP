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
    public function transcribe(string $audioContent, string $language = 'en-US', ?string $contentType = null): ?array
    {
        $azure = $this->transcribeWithAzure($audioContent, $language, $contentType);
        if ($azure !== null) {
            return $azure;
        }

        return $this->transcribeWithOpenAi($audioContent, $language, $contentType);
    }

    /**
     * @return array{text: string, confidence: float, duration_ms: int, word_count: int, pause_count: int, speaking_rate: float, pronunciation: ?array}|null
     */
    private function transcribeWithAzure(string $audioContent, string $language, ?string $contentType): ?array
    {
        $key = $this->key();
        if ($key === '') {
            return null;
        }

        $region = $this->region();
        $endpoint = "https://{$region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1";
        $lastFailure = null;

        try {
            foreach ($this->azureContentTypeCandidates($contentType) as $candidate) {
                $response = Http::withHeaders([
                    'Ocp-Apim-Subscription-Key' => $key,
                    'Content-Type' => $candidate,
                    'Accept' => 'application/json',
                    'Pronunciation-Assessment' => base64_encode(json_encode([
                        'GradingSystem' => 'HundredMark',
                        'Granularity' => 'Word',
                        'Dimension' => 'Comprehensive',
                        'EnableMiscue' => true,
                        'EnableProsodyAssessment' => true,
                    ], JSON_THROW_ON_ERROR)),
                ])
                    ->withQueryParameters([
                        'language' => $language,
                        'format' => 'detailed',
                    ])
                    ->withBody($audioContent, $candidate)
                    ->timeout(30)
                    ->post($endpoint);

                if ($response->successful()) {
                    return $this->parseAzureResponse($response->json());
                }

                $lastFailure = [
                    'content_type' => $candidate,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ];
            }

            Log::error('Azure STT failed', $lastFailure ?? []);

            return null;
        } catch (\Throwable $e) {
            Log::error('Azure STT exception', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * @return array{text: string, confidence: float, duration_ms: int, word_count: int, pause_count: int, speaking_rate: float, pronunciation: ?array}|null
     */
    private function transcribeWithOpenAi(string $audioContent, string $language, ?string $contentType): ?array
    {
        $key = (string) config('ai.providers.openai.key');
        if ($key === '') {
            return null;
        }

        $baseUrl = rtrim((string) (config('ai.providers.openai.url') ?: 'https://api.openai.com'), '/');
        $endpoint = $baseUrl.(str_ends_with($baseUrl, '/v1') ? '/audio/transcriptions' : '/v1/audio/transcriptions');
        $mime = $this->normalizeMime($contentType) ?? 'audio/mp4';
        $filename = 'speech.'.$this->extensionForMime($mime);

        try {
            $response = Http::withToken($key)
                ->acceptJson()
                ->attach('file', $audioContent, $filename, ['Content-Type' => $mime])
                ->timeout(45)
                ->post($endpoint, [
                    'model' => env('OPENAI_TRANSCRIPTION_MODEL', 'whisper-1'),
                    'language' => strtolower(substr($language, 0, 2)),
                    'response_format' => 'json',
                ]);

            if (! $response->successful()) {
                Log::error('OpenAI STT failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return null;
            }

            $text = trim((string) ($response->json('text') ?? ''));
            if ($text === '') {
                return null;
            }

            $wordCount = str_word_count($text);

            return [
                'text' => $text,
                'confidence' => 0.0,
                'duration_ms' => 0,
                'word_count' => $wordCount,
                'pause_count' => 0,
                'speaking_rate' => 0.0,
                'pronunciation' => null,
            ];
        } catch (\Throwable $e) {
            Log::error('OpenAI STT exception', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * @param  array<string,mixed>  $data
     * @return array{text: string, confidence: float, duration_ms: int, word_count: int, pause_count: int, speaking_rate: float, pronunciation: ?array}
     */
    private function parseAzureResponse(array $data): array
    {
        $best = $data['NBest'][0] ?? null;
        $durationMs = (int) (((int) ($data['Duration'] ?? 0)) / 10_000);

        $pronAssessment = $best['PronunciationAssessment'] ?? $best;

        $words = $best['Words'] ?? $data['Words'] ?? [];
        $wordCount = count($words);
        $pauseCount = 0;
        $mispronunciationCount = 0;
        $unexpectedBreakCount = 0;
        $missingBreakCount = 0;
        $monotoneCount = 0;
        $lowAccuracyWords = [];
        for ($i = 1; $i < $wordCount; $i++) {
            $prevEnd = ($words[$i - 1]['Offset'] ?? 0) + ($words[$i - 1]['Duration'] ?? 0);
            $currStart = $words[$i]['Offset'] ?? 0;
            if (($currStart - $prevEnd) > 50_000) {
                $pauseCount++;
            }
        }

        foreach ($words as $word) {
            $errorType = (string) ($word['ErrorType'] ?? '');
            $accuracyScore = (float) ($word['AccuracyScore'] ?? 100);
            if ($errorType === 'Mispronunciation') {
                $mispronunciationCount++;
            }
            if ($accuracyScore < 60.0 && count($lowAccuracyWords) < 10) {
                $lowAccuracyWords[] = [
                    'word' => (string) ($word['Word'] ?? ''),
                    'accuracy' => round($accuracyScore / 10, 1),
                    'error_type' => $errorType !== '' ? $errorType : null,
                ];
            }

            $prosody = $word['Feedback']['Prosody'] ?? [];
            $breakErrors = (array) ($prosody['Break']['ErrorTypes'] ?? []);
            if (in_array('UnexpectedBreak', $breakErrors, true)) {
                $unexpectedBreakCount++;
            }
            if (in_array('MissingBreak', $breakErrors, true)) {
                $missingBreakCount++;
            }
            $intonationErrors = (array) ($prosody['Intonation']['ErrorTypes'] ?? []);
            if (in_array('Monotone', $intonationErrors, true)) {
                $monotoneCount++;
            }
        }

        $pronScores = isset($pronAssessment['PronScore']) ? [
            'accuracy' => round((float) ($pronAssessment['AccuracyScore'] ?? 0) / 10, 1),
            'fluency' => round((float) ($pronAssessment['FluencyScore'] ?? 0) / 10, 1),
            'prosody' => round((float) ($pronAssessment['ProsodyScore'] ?? 0) / 10, 1),
            'completeness' => round((float) ($pronAssessment['CompletenessScore'] ?? 0) / 10, 1),
            'overall' => round((float) ($pronAssessment['PronScore'] ?? 0) / 10, 1),
            'mispronunciation_count' => $mispronunciationCount,
            'unexpected_break_count' => $unexpectedBreakCount,
            'missing_break_count' => $missingBreakCount,
            'monotone_count' => $monotoneCount,
            'low_accuracy_words' => $lowAccuracyWords,
        ] : null;

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
    }

    /**
     * @return list<string>
     */
    private function azureContentTypeCandidates(?string $contentType): array
    {
        return array_values(array_unique(array_filter([
            $this->normalizeMime($contentType),
            'audio/webm; codecs=opus',
            'audio/ogg; codecs=opus',
            'audio/wav; codecs=audio/pcm; samplerate=16000',
            'audio/wav',
        ])));
    }

    private function normalizeMime(?string $contentType): ?string
    {
        $mime = strtolower(trim((string) $contentType));
        if ($mime === '') {
            return null;
        }

        if (str_contains($mime, 'm4a') || str_contains($mime, 'mp4')) {
            return 'audio/mp4';
        }

        if (str_contains($mime, 'mpeg') || str_contains($mime, 'mp3')) {
            return 'audio/mpeg';
        }

        if (str_contains($mime, 'webm')) {
            return 'audio/webm; codecs=opus';
        }

        if (str_contains($mime, 'ogg') || str_contains($mime, 'opus')) {
            return 'audio/ogg; codecs=opus';
        }

        if (str_contains($mime, 'wav')) {
            return 'audio/wav';
        }

        return $mime;
    }

    private function extensionForMime(string $mime): string
    {
        return match (true) {
            str_contains($mime, 'webm') => 'webm',
            str_contains($mime, 'ogg') || str_contains($mime, 'opus') => 'ogg',
            str_contains($mime, 'wav') => 'wav',
            str_contains($mime, 'mpeg') => 'mp3',
            default => 'm4a',
        };
    }

    /**
     * Transcribe from R2 audio key (download + transcribe).
     */
    public function transcribeFromStorage(string $audioKey, AudioStorageService $storage): ?array
    {
        try {
            $content = $storage->getContent($audioKey);

            return $this->transcribe($content, 'en-US', $this->mimeFromAudioKey($audioKey));
        } catch (\Throwable $e) {
            Log::error('STT from storage failed', ['key' => $audioKey, 'error' => $e->getMessage()]);

            return null;
        }
    }

    private function mimeFromAudioKey(string $audioKey): ?string
    {
        $extension = strtolower(pathinfo(parse_url($audioKey, PHP_URL_PATH) ?: $audioKey, PATHINFO_EXTENSION));

        return match ($extension) {
            'm4a', 'mp4', 'aac' => 'audio/mp4',
            'mp3', 'mpeg' => 'audio/mpeg',
            'ogg', 'opus' => 'audio/ogg',
            'wav' => 'audio/wav',
            'webm' => 'audio/webm',
            default => null,
        };
    }
}
