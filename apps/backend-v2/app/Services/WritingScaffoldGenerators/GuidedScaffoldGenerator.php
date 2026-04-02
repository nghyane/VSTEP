<?php

declare(strict_types=1);

namespace App\Services\WritingScaffoldGenerators;

use App\Enums\WritingScaffoldType;
use App\Models\Question;
use App\Support\WritingHints;

class GuidedScaffoldGenerator implements WritingScaffoldGenerator
{
    public function generate(Question $question, int $tier): array
    {
        return [
            'question_id' => $question->id,
            'tier' => $tier,
            'requested_tier' => $tier,
            'effective_tier' => $tier,
            'type' => WritingScaffoldType::Guided->value,
            'payload' => WritingHints::forQuestion($question->content, $question->level, $question->part),
            'fallback_reason' => null,
        ];
    }
}
