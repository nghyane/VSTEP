<?php

declare(strict_types=1);

namespace App\Assessment\Services;

use App\Assessment\Data\AssessmentInput;
use App\Assessment\Enums\AssessmentSourceType;
use App\Assessment\Enums\AssessmentTaskType;
use App\Jobs\ProcessAssessmentJob;
use App\Models\AssessmentJob;
use App\Models\ExamSpeakingSubmission;
use App\Models\ExamVersionSpeakingPart;
use App\Models\ExamVersionWritingTask;
use App\Models\ExamWritingSubmission;
use App\Models\PracticeSpeakingSubmission;
use App\Models\PracticeSpeakingTask;
use App\Models\PracticeWritingPrompt;
use App\Models\PracticeWritingSubmission;
use Illuminate\Support\Facades\DB;

final readonly class AssessmentIntakeService
{
    public function __construct(
        private AssessmentSubmissionService $submissions,
    ) {}

    public function submitPracticeWriting(PracticeWritingSubmission $submission): AssessmentJob
    {
        $prompt = PracticeWritingPrompt::query()->findOrFail($submission->prompt_id);
        $taskType = $this->writingTaskType((int) $prompt->part);

        return $this->submit(new AssessmentInput(
            profileId: $submission->profile_id,
            skill: $taskType->skill(),
            taskType: $taskType,
            sourceType: AssessmentSourceType::Practice,
            sourceId: $submission->id,
            prompt: ['part' => $prompt->part, 'prompt' => $prompt->prompt],
            requirements: $prompt->required_points ?? [],
            text: $submission->text,
            metadata: ['word_count' => $submission->word_count],
        ));
    }

    public function submitPracticeSpeaking(PracticeSpeakingSubmission $submission): AssessmentJob
    {
        $task = PracticeSpeakingTask::query()->findOrFail($submission->task_ref_id);
        $taskType = $this->speakingTaskType((int) $task->part);

        return $this->submit(new AssessmentInput(
            profileId: $submission->profile_id,
            skill: $taskType->skill(),
            taskType: $taskType,
            sourceType: AssessmentSourceType::Practice,
            sourceId: $submission->id,
            prompt: ['part' => $task->part, 'content' => $task->content],
            audioUrl: $submission->audio_url,
            metadata: ['duration_seconds' => $submission->duration_seconds],
        ));
    }

    public function submitExamWriting(ExamWritingSubmission $submission): AssessmentJob
    {
        $task = ExamVersionWritingTask::query()->findOrFail($submission->task_id);
        $taskType = $this->writingTaskType((int) $task->part);

        return $this->submit(new AssessmentInput(
            profileId: $submission->profile_id,
            skill: $taskType->skill(),
            taskType: $taskType,
            sourceType: AssessmentSourceType::Exam,
            sourceId: $submission->id,
            prompt: ['part' => $task->part, 'prompt' => $task->prompt, 'instructions' => $task->instructions],
            requirements: $task->requirements ?? [],
            text: $submission->text,
            metadata: ['word_count' => $submission->word_count],
        ));
    }

    public function submitExamSpeaking(ExamSpeakingSubmission $submission): AssessmentJob
    {
        $part = ExamVersionSpeakingPart::query()->findOrFail($submission->part_id);
        $taskType = $this->speakingTaskType((int) $part->part);

        return $this->submit(new AssessmentInput(
            profileId: $submission->profile_id,
            skill: $taskType->skill(),
            taskType: $taskType,
            sourceType: AssessmentSourceType::Exam,
            sourceId: $submission->id,
            prompt: ['part' => $part->part, 'content' => $part->content, 'type' => $part->type],
            requirements: $part->requirements ?? [],
            audioUrl: $submission->audio_url,
            metadata: ['duration_seconds' => $submission->duration_seconds],
        ));
    }

    private function submit(AssessmentInput $input): AssessmentJob
    {
        $attempt = $this->submissions->submit($input);
        $job = $attempt->job ?? throw new \RuntimeException('Assessment job was not created.');

        if (DB::transactionLevel() > 0) {
            DB::afterCommit(fn () => ProcessAssessmentJob::dispatch($job->id));
        } else {
            ProcessAssessmentJob::dispatch($job->id);
        }

        return $job->refresh();
    }

    private function writingTaskType(int $part): AssessmentTaskType
    {
        return $part === 1 ? AssessmentTaskType::WritingTask1Letter : AssessmentTaskType::WritingTask2Essay;
    }

    private function speakingTaskType(int $part): AssessmentTaskType
    {
        return match ($part) {
            1 => AssessmentTaskType::SpeakingPart1Personal,
            2 => AssessmentTaskType::SpeakingPart2Solution,
            3 => AssessmentTaskType::SpeakingPart3Discussion,
            default => throw new \InvalidArgumentException("Unsupported speaking part: {$part}"),
        };
    }
}
