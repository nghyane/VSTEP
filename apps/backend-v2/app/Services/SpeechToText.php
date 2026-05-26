<?php

declare(strict_types=1);

namespace App\Services;

interface SpeechToText
{
    /**
     * Transcribe audio content (binary) to text with timing metrics.
     *
     * @param  string  $audioContent  Raw audio bytes
     * @param  string  $language  BCP-47 language tag
     * @return array{text: string, confidence: float, duration_ms: int, word_count: int, pause_count: int, speaking_rate: float, pronunciation: ?array}|null
     */
    public function transcribe(string $audioContent, string $language = 'en-US'): ?array;

    /**
     * Transcribe from storage key (download + transcribe).
     *
     * @return array{text: string, confidence: float, duration_ms: int}|null
     */
    public function transcribeFromStorage(string $audioKey, AudioStorageService $storage): ?array;
}
