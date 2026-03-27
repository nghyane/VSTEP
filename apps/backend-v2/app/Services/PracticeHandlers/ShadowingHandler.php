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

    public function enrichItem(Question $question): array
    {
        return [
            'reference_text' => $question->content['prompt'] ?? '',
            'reference_audio_path' => $question->content['reference_audio_path'] ?? null,
        ];
    }
}
