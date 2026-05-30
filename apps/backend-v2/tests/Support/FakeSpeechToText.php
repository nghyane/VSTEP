<?php

declare(strict_types=1);

namespace Tests\Support;

use App\Services\AudioStorageService;
use App\Services\SpeechToText;

/**
 * Test fake — bypass real STT endpoint. Returns deterministic transcript.
 */
final class FakeSpeechToText implements SpeechToText
{
    public function transcribe(string $audioContent, string $language = 'en-US', ?string $contentType = null): ?array
    {
        return $this->mockResult();
    }

    public function transcribeFromStorage(string $audioKey, AudioStorageService $storage): ?array
    {
        return $this->mockResult();
    }

    /**
     * @return array{text: string, confidence: float, duration_ms: int, word_count: int, pause_count: int, speaking_rate: float}
     */
    private function mockResult(): array
    {
        return [
            'text' => 'This is a test transcript.',
            'confidence' => 0.9,
            'duration_ms' => 5000,
            'word_count' => 6,
            'pause_count' => 1,
            'speaking_rate' => 72.0,
            'pronunciation' => [
                'accuracy' => 8.0,
                'fluency' => 7.5,
                'prosody' => 7.0,
                'overall' => 7.5,
            ],
        ];
    }
}
