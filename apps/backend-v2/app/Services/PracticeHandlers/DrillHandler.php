<?php

declare(strict_types=1);

namespace App\Services\PracticeHandlers;

use App\Models\Question;

class DrillHandler extends AbstractPronunciationHandler
{
    protected function type(): string
    {
        return 'drill';
    }

    public function enrichItem(Question $question, ?int $writingTier = null): array
    {
        return [
            'target_text' => self::extractText($question->content),
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
