<?php

declare(strict_types=1);

namespace App\Services\PracticeHandlers;

use App\Contracts\PracticeModeHandler;
use App\Enums\SubmissionStatus;
use App\Models\Question;
use App\Models\Submission;
use App\Services\PronunciationService;
use App\Support\VstepScoring;

class ShadowingHandler implements PracticeModeHandler
{
    public function __construct(
        private readonly PronunciationService $pronunciation,
    ) {}

    public function processAnswer(Submission $submission, Question $question, array $answer): array
    {
        $pronunciation = $this->pronunciation->assessPronunciation($answer['audio_path']);
        $score = VstepScoring::round($pronunciation['accuracy_score'] / 10);

        $submission->update([
            'status' => SubmissionStatus::Completed,
            'score' => $score,
            'result' => ['type' => 'shadowing', 'pronunciation' => $pronunciation],
            'completed_at' => now(),
        ]);

        return [
            'type' => 'shadowing',
            'score' => $score,
            'pronunciation' => $pronunciation,
            'reference_text' => $question->content['prompt'] ?? '',
        ];
    }

    public function supportsRetry(): bool
    {
        return true;
    }

    public function enrichItem(Question $question): array
    {
        return [
            'reference_text' => $question->content['prompt'] ?? '',
        ];
    }
}
