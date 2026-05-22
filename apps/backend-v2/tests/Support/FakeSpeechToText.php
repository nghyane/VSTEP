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
    public function transcribe(string $audioContent, string $language = 'en-US'): ?array
    {
        return $this->mockResult();
    }

    public function transcribeFromStorage(string $audioKey, AudioStorageService $storage): ?array
    {
        return $this->mockResult();
    }

    /**
     * @return array{text: string, confidence: float, duration_ms: int}
     */
    private function mockResult(): array
    {
        return [
            'text' => 'This is a test transcript.',
            'confidence' => 0.9,
            'duration_ms' => 5000,
        ];
    }
}
