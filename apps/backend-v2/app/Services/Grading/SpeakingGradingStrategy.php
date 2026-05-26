<?php

declare(strict_types=1);

namespace App\Services\Grading;

use App\DTOs\Grading\GradingResultData;
use App\DTOs\Grading\SpeakingGradingData;
use App\Enums\GradingJobStatus;
use App\Exceptions\GradingFailedException;
use App\Models\ExamSpeakingSubmission;
use App\Models\GradingJob;
use App\Models\PracticeSpeakingSubmission;
use App\Models\SpeakingGradingResult;
use App\Services\AudioStorageService;
use App\Services\SpeechToText;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

final class SpeakingGradingStrategy implements GradingStrategy
{
    public function __construct(
        private readonly SpeechToText $stt,
        private readonly AudioStorageService $audio,
        private readonly LlmGrader $llm,
        private readonly RubricResolver $rubricResolver,
    ) {}

    public function supports(): array
    {
        return ['practice_speaking', 'exam_speaking'];
    }

    public function loadSubmission(GradingJob $job): ?Model
    {
        return match ($job->submission_type) {
            'practice_speaking' => PracticeSpeakingSubmission::query()->find($job->submission_id),
            'exam_speaking' => ExamSpeakingSubmission::query()->find($job->submission_id),
            default => null,
        };
    }

    public function grade(Model $submission): GradingResultData
    {
        $audioUrl = (string) ($submission->audio_url ?? '');
        if ($audioUrl === '') {
            throw new GradingFailedException('Speaking submission missing audio_url');
        }

        $rubric = $this->rubricResolver->active('speaking');

        // Step 1: STT (throws GradingFailedException on failure → job retries).
        try {
            $sttResult = $this->stt->transcribeFromStorage($audioUrl, $this->audio);
        } catch (\RuntimeException $e) {
            throw new GradingFailedException($e->getMessage(), previous: $e);
        }

        if ($sttResult === null) {
            throw new GradingFailedException('Speech-to-text transcription failed');
        }

        $transcript = (string) $sttResult['text'];
        $pronunciationScore = (int) ($sttResult['confidence'] * 100);

        // Side effect: persist transcript on submission for reuse.
        $submission->update(['transcript' => $transcript]);

        // Step 2: LLM grading with rubric context.
        $llmResult = $this->llm->gradeSpeaking(
            $transcript,
            $rubric,
            ['accuracy_score' => $pronunciationScore],
        );

        return new SpeakingGradingData(
            rubricScores: $llmResult['rubric_scores'],
            overallBand: $rubric->computeOverallBand($llmResult['rubric_scores']),
            strengths: $llmResult['strengths'],
            improvements: $llmResult['improvements'],
            transcript: $transcript,
            pronunciationReport: ['accuracy_score' => $pronunciationScore],
            rubricId: $rubric->id,
        );
    }

    public function persistResult(GradingJob $job, GradingResultData $data): void
    {
        DB::transaction(function () use ($job, $data) {
            // Advisory lock keyed by submission — serialize concurrent grading.
            DB::statement('SELECT pg_advisory_xact_lock(?)', [crc32($job->submission_type.':'.$job->submission_id)]);

            $version = SpeakingGradingResult::query()
                ->where('submission_type', $job->submission_type)
                ->where('submission_id', $job->submission_id)
                ->max('version') ?? 0;

            SpeakingGradingResult::query()
                ->where('submission_type', $job->submission_type)
                ->where('submission_id', $job->submission_id)
                ->where('is_active', true)
                ->update(['is_active' => false]);

            SpeakingGradingResult::create([
                ...$data->toModelAttributes(),
                'job_id' => $job->id,
                'submission_type' => $job->submission_type,
                'submission_id' => $job->submission_id,
                'version' => $version + 1,
                'is_active' => true,
            ]);

            $job->update([
                'status' => GradingJobStatus::Ready,
                'completed_at' => now(),
            ]);
        });
    }
}
