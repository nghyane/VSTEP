<?php

declare(strict_types=1);

namespace App\Assessment\Services;

use App\Assessment\Contracts\RubricResolver;
use App\Assessment\Data\AssessmentInput;
use App\Assessment\Enums\AssessmentJobStatus;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentJob;
use Illuminate\Support\Facades\DB;

final readonly class AssessmentSubmissionService
{
    public function __construct(
        private RubricResolver $rubricResolver,
    ) {}

    public function submit(AssessmentInput $input): AssessmentAttempt
    {
        $rubric = $this->rubricResolver->activeFor($input->taskType);

        return DB::transaction(function () use ($input, $rubric): AssessmentAttempt {
            $attempt = AssessmentAttempt::create([
                'profile_id' => $input->profileId,
                'rubric_id' => $rubric->id,
                'skill' => $input->skill,
                'task_type' => $input->taskType,
                'source_type' => $input->sourceType,
                'source_id' => $input->sourceId,
                'prompt' => [
                    ...$input->prompt,
                    'requirements' => $input->requirements,
                ],
                'response_payload' => [
                    'text' => $input->text,
                    'audio_key' => $input->audioKey,
                    'audio_url' => $input->audioUrl,
                    'metadata' => $input->metadata,
                ],
                'submitted_at' => now(),
            ]);

            AssessmentJob::create([
                'attempt_id' => $attempt->id,
                'status' => AssessmentJobStatus::Pending,
                'progress' => ['stage' => 'queued'],
            ]);

            return $attempt->load('job');
        });
    }
}
