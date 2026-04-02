<?php

declare(strict_types=1);

namespace App\Services\WritingScaffoldGenerators;

use App\Enums\WritingScaffoldType;
use App\Models\Question;

class FreeformScaffoldGenerator implements WritingScaffoldGenerator
{
    public function generate(Question $question, int $tier): array
    {
        return [
            'question_id' => $question->id,
            'tier' => $tier,
            'requested_tier' => $tier,
            'effective_tier' => $tier,
            'type' => WritingScaffoldType::Freeform->value,
            'payload' => null,
            'fallback_reason' => null,
        ];
    }
}
