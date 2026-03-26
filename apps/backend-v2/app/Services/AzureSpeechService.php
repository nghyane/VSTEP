<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class AzureSpeechService
{
    private string $key;

    private string $region;

    /**
     * Azure short-audio REST pronunciation assessment only supports these formats.
     */
    private const SUPPORTED_FORMATS = [
        'wav' => 'audio/wav; codecs=audio/pcm; samplerate=16000',
        'ogg' => 'audio/ogg; codecs=opus',
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
    public function assess(string $audioPath): array
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
            Log::error('azure_speech_failed', [
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
        $assessment = $nBest['PronunciationAssessment'] ?? [];

        $wordErrors = [];
        foreach ($nBest['Words'] ?? [] as $word) {
            $wa = $word['PronunciationAssessment'] ?? [];
            if (($wa['ErrorType'] ?? 'None') !== 'None') {
                $wordErrors[] = [
                    'word' => $word['Word'] ?? '',
                    'error_type' => $wa['ErrorType'] ?? 'Unknown',
                    'accuracy_score' => $wa['AccuracyScore'] ?? 0,
                ];
            }
        }

        return [
            'transcript' => $nBest['Display'] ?? $data['DisplayText'] ?? '',
            'accuracy_score' => $assessment['AccuracyScore'] ?? 0.0,
            'fluency_score' => $assessment['FluencyScore'] ?? 0.0,
            'prosody_score' => $assessment['ProsodyScore'] ?? 0.0,
            'word_errors' => $wordErrors,
        ];
    }

    private function validateAudioMime(string $content): void
    {
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->buffer($content);
        $allowed = ['audio/x-wav', 'audio/wav', 'audio/ogg', 'application/ogg'];

        if (! in_array($mime, $allowed)) {
            throw new RuntimeException("Invalid audio MIME type: {$mime}. Only WAV and OGG are supported.");
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
