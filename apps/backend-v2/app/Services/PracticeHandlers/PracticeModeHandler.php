<?php

declare(strict_types=1);

namespace App\Services\PracticeHandlers;

use App\Models\Question;
use App\Models\Submission;

interface PracticeModeHandler
{
    /**
     * Process the learner's answer and return the result.
     * For sync modes (shadowing/drill): returns result immediately.
     * For async modes (free/guided): dispatches grading job, returns pending status.
     */
    public function processAnswer(Submission $submission, Question $question, array $answer): array;

    public function supportsRetry(): bool;

    /**
     * Build mode-specific data for the current item (e.g., reference audio for shadowing).
     */
    public function enrichItem(Question $question): array;
}
