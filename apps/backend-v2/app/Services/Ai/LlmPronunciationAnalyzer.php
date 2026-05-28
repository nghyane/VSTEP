<?php

declare(strict_types=1);

namespace App\Services\Ai;

use App\Ai\AiClient;
use App\Ai\Contracts\PronunciationAnalyzer;
use App\Exceptions\AiServiceUnavailableException;
use Illuminate\Support\Facades\Log;

final class LlmPronunciationAnalyzer implements PronunciationAnalyzer
{
    public function __construct(
        private readonly AiClient $ai,
    ) {}

    public function analyze(string $original, string $transcript): array
    {
        $prompt = view('ai.conversation.pronunciation', [
            'original' => $original,
            'transcript' => $transcript,
        ])->render();

        $structured = $this->ai->toolCall(
            service: 'pronunciation',
            prompt: $prompt,
            toolName: 'pronunciation_review',
            toolDescription: 'Analyze pronunciation accuracy',
            parametersSchema: [
                'pronunciation' => ['type' => 'string'],
                'intonation' => ['type' => 'string'],
                'tip' => ['type' => 'string'],
            ],
        );

        if (! isset($structured['pronunciation'])) {
            throw new AiServiceUnavailableException;
        }

        return $structured;
    }

    public function generateIpa(string $text): ?string
    {
        try {
            $result = $this->ai->toolCall(
                service: 'pronunciation',
                prompt: "Convert this English text to IPA phonetic transcription.\n\nText: \"{$text}\"",
                toolName: 'generate_ipa',
                toolDescription: 'Generate IPA transcription for English text',
                parametersSchema: ['ipa' => ['type' => 'string']],
            );
            $ipa = trim((string) ($result['ipa'] ?? ''), " \t\n\r\0\x0B/");
            if ($ipa !== '' && mb_strlen($ipa) > 2) {
                return $ipa;
            }
        } catch (\Throwable $e) {
            Log::warning('IPA generation failed', ['error' => $e->getMessage()]);
        }

        return null;
    }
}
