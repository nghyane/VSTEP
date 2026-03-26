<?php

declare(strict_types=1);

namespace App\Services\PracticeHandlers;

use App\Contracts\PracticeModeHandler;
use App\Jobs\GradeSubmission;
use App\Models\Question;
use App\Models\Submission;

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
            'outline' => $question->content['outline'] ?? null,
        ];
    }
}
