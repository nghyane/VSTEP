<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\SubmissionStatus;
use App\Models\Submission;
use Illuminate\Support\Facades\Redis;

class GradingDispatcher
{
    private const STREAM = 'grading:tasks';

    public function dispatch(Submission $submission): void
    {
        if ($submission->skill->isObjective()) {
            return;
        }

        $submission->update(['status' => SubmissionStatus::Processing]);

        $payload = json_encode([
            'submissionId' => $submission->id,
            'questionId' => $submission->question_id,
            'skill' => $submission->skill->value,
            'answer' => $submission->answer,
            'dispatchedAt' => now()->toAtomString(),
        ], JSON_THROW_ON_ERROR);

        Redis::xadd(self::STREAM, '*', ['payload' => $payload]);
    }
}
