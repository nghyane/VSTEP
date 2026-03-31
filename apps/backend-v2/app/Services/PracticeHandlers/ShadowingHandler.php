<?php

declare(strict_types=1);

namespace App\Services\PracticeHandlers;

use App\Models\Question;

class ShadowingHandler extends AbstractPronunciationHandler
{
    protected function type(): string
    {
        return 'shadowing';
    }

    public function enrichItem(Question $question, ?int $writingTier = null): array
    {
        return [
            'reference_text' => self::extractText($question->content),
            'reference_audio_path' => $question->content['reference_audio_path'] ?? null,
        ];
    }

    private static function extractText(array $content): string
    {
        return $content['prompt']
            ?? $content['topics'][0]['questions'][0]
            ?? $content['situation']
            ?? $content['centralIdea']
            ?? '';
    }
}
