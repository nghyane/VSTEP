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

    public function enrichItem(Question $question): array
    {
        return [
            'target_text' => $question->content['prompt'] ?? '',
        ];
    }
}
