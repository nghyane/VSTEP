<?php

declare(strict_types=1);

namespace App\Services\PracticeHandlers;

use App\Contracts\PracticeModeHandler;
use App\Jobs\GradeSubmission;
use App\Models\Question;
use App\Models\Submission;
use App\Support\VstepScoring;

class FreeModeHandler implements PracticeModeHandler
{
    public function processAnswer(Submission $submission, Question $question, array $answer): array
    {
        if ($question->skill->isObjective()) {
            $result = $question->gradeObjective($answer['answers'] ?? []);

            return [
                'type' => 'objective',
                'correct' => $result['all_correct'] ?? false,
                'score' => $result ? VstepScoring::score($result['raw_ratio']) : 0,
            ];
        }

        GradeSubmission::dispatch($submission->id);

        return ['type' => 'subjective', 'status' => 'processing'];
    }

    public function supportsRetry(): bool
    {
        return false;
    }

    public function enrichItem(Question $question): array
    {
        return [];
    }
}
