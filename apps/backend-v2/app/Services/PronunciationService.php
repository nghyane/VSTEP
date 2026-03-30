<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class PronunciationService
{
    private string $key;

    private string $region;

    /**
     * Azure short-audio REST pronunciation assessment only supports these formats.
     */
    private const SUPPORTED_FORMATS = [
        'wav' => 'audio/wav; codecs=audio/pcm; samplerate=16000',
        'ogg' => 'audio/ogg; codecs=opus',
        'webm' => 'audio/webm; codecs=opus',
    ];

    public function __construct()
    {
        $this->key = (string) config('services.azure_speech.key', '');
        $this->region = (string) config('services.azure_speech.region', 'southeastasia');
    }

    /**
     * Assess pronunciation from an audio file stored on S3/R2.
     *
     * @return array{transcript: string, accuracy_score: float, fluency_score: float, prosody_score: float, word_errors: array}
     */
    public function assessPronunciation(string $audioPath): array
    {
        $audioContent = Storage::disk('s3')->get($audioPath);

        if (! $audioContent) {
            throw new RuntimeException("Audio file not found: {$audioPath}");
        }

        $this->validateAudioMime($audioContent);
        $this->validateSize($audioContent);

        $ext = strtolower(pathinfo($audioPath, PATHINFO_EXTENSION));
        $contentType = self::SUPPORTED_FORMATS[$ext]
            ?? throw new RuntimeException("Unsupported audio format: {$ext}");

        $endpoint = "https://{$this->region}.stt.speech.microsoft.com"
            .'/speech/recognition/conversation/cognitiveservices/v1'
            .'?language=en-US&format=detailed';

        $pronunciationConfig = base64_encode(json_encode([
            'ReferenceText' => '',
            'GradingSystem' => 'HundredMark',
            'Granularity' => 'Word',
            'Dimension' => 'Comprehensive',
            'EnableProsodyAssessment' => 'True',
        ], JSON_THROW_ON_ERROR));

        $response = Http::timeout(30)
            ->withHeaders([
                'Ocp-Apim-Subscription-Key' => $this->key,
                'Content-Type' => $contentType,
                'Pronunciation-Assessment' => $pronunciationConfig,
                'Accept' => 'application/json',
            ])
            ->withBody($audioContent, $contentType)
            ->post($endpoint);

        if ($response->failed()) {
            Log::error('pronunciation_assessment_failed', [
                'status' => $response->status(),
                'audio_path' => $audioPath,
            ]);
            throw new RuntimeException("Azure Speech API returned {$response->status()}");
        }

        return $this->parseResponse($response->json());
    }

    private function parseResponse(array $data): array
    {
        $nBest = $data['NBest'][0] ?? [];

        $wordErrors = [];
        foreach ($nBest['Words'] ?? [] as $word) {
            $errorType = $word['ErrorType'] ?? $word['PronunciationAssessment']['ErrorType'] ?? 'None';
            if ($errorType !== 'None') {
                $wordErrors[] = [
                    'word' => $word['Word'] ?? '',
                    'error_type' => $errorType,
                    'accuracy_score' => $word['AccuracyScore'] ?? $word['PronunciationAssessment']['AccuracyScore'] ?? 0,
                ];
            }
        }

        return [
            'transcript' => $nBest['Display'] ?? $data['DisplayText'] ?? '',
            'accuracy_score' => (float) ($nBest['AccuracyScore'] ?? $nBest['PronunciationAssessment']['AccuracyScore'] ?? 0),
            'fluency_score' => (float) ($nBest['FluencyScore'] ?? $nBest['PronunciationAssessment']['FluencyScore'] ?? 0),
            'prosody_score' => (float) ($nBest['ProsodyScore'] ?? $nBest['PronunciationAssessment']['ProsodyScore'] ?? 0),
            'word_errors' => $wordErrors,
        ];
    }

    private function validateAudioMime(string $content): void
    {
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->buffer($content);
        $allowed = ['audio/x-wav', 'audio/wav', 'audio/ogg', 'application/ogg', 'audio/webm'];

        if (! in_array($mime, $allowed)) {
            throw new RuntimeException("Invalid audio MIME type: {$mime}. Only WAV, OGG, and WebM are supported.");
        }
    }

    private function validateSize(string $content): void
    {
        $maxBytes = 5 * 1024 * 1024; // 5MB
        if (strlen($content) > $maxBytes) {
            throw new RuntimeException('Audio file exceeds 5MB limit.');
        }
    }

    public static function supportedExtensions(): array
    {
        return array_keys(self::SUPPORTED_FORMATS);
    }
}
