<?php

declare(strict_types=1);

namespace App\Services\PracticeHandlers;

use App\Jobs\GradeSubmission;
use App\Models\Question;
use App\Models\Submission;
use App\Support\WritingHints;

class GuidedHandler implements PracticeModeHandler
{
    public function processAnswer(Submission $submission, Question $question, array $answer): array
    {
        GradeSubmission::dispatch($submission->id);

        return ['type' => 'subjective', 'status' => 'processing'];
    }

    public function supportsRetry(): bool
    {
        return false;
    }

    public function enrichItem(Question $question, ?int $writingTier = null): array
    {
        // Tier 3 (freeform): no scaffolding
        if ($writingTier === 3) {
            return [];
        }

        // Tier 1 (template) and Tier 2 (guided): return hints
        // Tier 1 template is generated client-side via AI proxy
        return [
            'writing_hints' => WritingHints::forQuestion(
                $question->content,
                $question->level,
                $question->part,
            ),
        ];
    }
}
