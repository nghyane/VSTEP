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

    public function enrichItem(Question $question): array
    {
        return [
            'writing_hints' => WritingHints::forQuestion(
                $question->content,
                $question->level,
                $question->part,
            ),
        ];
    }
}
