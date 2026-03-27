<?php

declare(strict_types=1);

namespace App\Services\PracticeHandlers;

use App\Enums\SubmissionStatus;
use App\Models\Question;
use App\Models\Submission;
use App\Services\PronunciationService;
use App\Services\SpeakingUploadService;
use App\Support\VstepScoring;

abstract class AbstractPronunciationHandler implements PracticeModeHandler
{
    public function __construct(
        private readonly PronunciationService $pronunciation,
        private readonly SpeakingUploadService $uploadService,
    ) {}

    abstract protected function type(): string;

    public function processAnswer(Submission $submission, Question $question, array $answer): array
    {
        $this->uploadService->verifyAudioOwnership($answer['audio_path'], $submission->user_id);
        $pronunciation = $this->pronunciation->assessPronunciation($answer['audio_path']);
        $score = VstepScoring::round($pronunciation['accuracy_score'] / 10);

        $submission->update([
            'status' => SubmissionStatus::Completed,
            'score' => $score,
            'result' => ['type' => $this->type(), 'pronunciation' => $pronunciation],
            'completed_at' => now(),
        ]);

        return [
            'type' => $this->type(),
            'score' => $score,
            'pronunciation' => $pronunciation,
        ];
    }

    public function supportsRetry(): bool
    {
        return true;
    }
}
