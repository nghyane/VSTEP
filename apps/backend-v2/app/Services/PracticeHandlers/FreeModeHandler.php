<?php

declare(strict_types=1);

namespace App\Services\PracticeHandlers;

use App\Enums\Skill;
use App\Enums\SubmissionStatus;
use App\Jobs\GradeSubmission;
use App\Models\Question;
use App\Models\Submission;
use App\Support\VstepScoring;
use App\Support\WritingHints;

class FreeModeHandler implements PracticeModeHandler
{
    public function processAnswer(Submission $submission, Question $question, array $answer): array
    {
        if ($question->skill->isObjective()) {
            return $this->gradeObjective($submission, $question, $answer);
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
        if ($question->skill === Skill::Writing) {
            return [
                'writing_hints' => WritingHints::forQuestion(
                    $question->content,
                    $question->level,
                    $question->part,
                ),
            ];
        }

        return [];
    }

    private function gradeObjective(Submission $submission, Question $question, array $answer): array
    {
        $result = $question->gradeObjective($answer['answers'] ?? []);
        $score = $result ? VstepScoring::score($result['raw_ratio']) : 0;

        $submission->update([
            'status' => SubmissionStatus::Completed,
            'score' => $score,
            'result' => ['type' => 'objective', ...$result ?? []],
            'completed_at' => now(),
        ]);

        return [
            'type' => 'objective',
            'correct' => $result['all_correct'] ?? false,
            'score' => $score,
        ];
    }
}
