<?php

declare(strict_types=1);

namespace App\Ai\Contracts;

interface PronunciationAnalyzer
{
    /**
     * Compare student transcript against original text.
     *
     * @return array{pronunciation: string, intonation: string, tip: string}
     */
    public function analyze(string $original, string $transcript): array;

    /**
     * Generate IPA transcription for English text.
     * Returns null on failure — IPA is optional UI hint.
     */
    public function generateIpa(string $text): ?string;
}
