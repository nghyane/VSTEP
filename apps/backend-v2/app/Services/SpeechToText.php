<?php

declare(strict_types=1);

namespace App\Services;

interface SpeechToText
{
    /**
     * Transcribe audio content.
     *
     * @return array{text: string, confidence: float, duration_ms: int}|null
     */
    public function transcribe(string $audioContent, string $language = 'en-US'): ?array;

    /**
     * Transcribe from storage key (download + transcribe).
     *
     * @return array{text: string, confidence: float, duration_ms: int}|null
     */
    public function transcribeFromStorage(string $audioKey, AudioStorageService $storage): ?array;
}
