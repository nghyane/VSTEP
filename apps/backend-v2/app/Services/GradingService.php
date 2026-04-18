<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\GradingJob;
use App\Models\PracticeSpeakingSubmission;
use App\Models\SpeakingGradingResult;
use App\Models\WritingGradingResult;
use Illuminate\Support\Facades\DB;

/**
 * Grading pipeline orchestration.
 *
 * Phase 1: enqueue job → mock AI result (no real AI call).
 * Phase 2: wire laravel/ai SDK + Azure Speech.
 *
 * Versioning: deactivate previous active result, create new with version++.
 */
class GradingService
{
    public function __construct(
        private readonly SpeechToTextService $sttService,
        private readonly AudioStorageService $audioService,
    ) {}

    public function enqueueWritingGrading(string $submissionType, string $submissionId): GradingJob
    {
        $job = GradingJob::create([
            'submission_type' => $submissionType,
            'submission_id' => $submissionId,
            'status' => 'pending',
        ]);

        // Phase 1: process synchronously with mock result.
        $this->processWritingJob($job);

        return $job->refresh();
    }

    public function enqueueSpeakingGrading(string $submissionType, string $submissionId): GradingJob
    {
        $job = GradingJob::create([
            'submission_type' => $submissionType,
            'submission_id' => $submissionId,
            'status' => 'pending',
        ]);

        $this->processSpeakingJob($job);

        return $job->refresh();
    }

    public function processWritingJob(GradingJob $job): void
    {
        DB::transaction(function () use ($job) {
            $job->update(['status' => 'processing', 'started_at' => now(), 'attempts' => $job->attempts + 1]);

            $version = WritingGradingResult::query()
                ->where('submission_type', $job->submission_type)
                ->where('submission_id', $job->submission_id)
                ->max('version') ?? 0;

            WritingGradingResult::query()
                ->where('submission_type', $job->submission_type)
                ->where('submission_id', $job->submission_id)
                ->where('is_active', true)
                ->update(['is_active' => false]);

            WritingGradingResult::create([
                'job_id' => $job->id,
                'submission_type' => $job->submission_type,
                'submission_id' => $job->submission_id,
                'version' => $version + 1,
                'is_active' => true,
                'rubric_scores' => [
                    'task_achievement' => 3.0, 'coherence' => 3.0,
                    'lexical' => 2.5, 'grammar' => 2.5,
                ],
                'overall_band' => 5.5,
                'strengths' => ['Clear structure', 'Good vocabulary range'],
                'improvements' => [
                    ['message' => 'Improve coherence', 'explanation' => 'Use more linking words'],
                ],
                'rewrites' => [
                    ['original' => 'Despite I tried', 'improved' => 'Despite trying', 'reason' => 'Grammar'],
                ],
                'annotations' => [],
                'paragraph_feedback' => [],
            ]);

            $job->update(['status' => 'ready', 'completed_at' => now()]);
        });
    }

    public function processSpeakingJob(GradingJob $job): void
    {
        DB::transaction(function () use ($job) {
            $job->update(['status' => 'processing', 'started_at' => now(), 'attempts' => $job->attempts + 1]);

            // STT: transcribe audio from R2 via Azure Speech.
            $submission = $this->loadSpeakingSubmission($job);
            $sttResult = null;
            $transcript = 'Transcript unavailable.';
            if ($submission !== null && $submission->audio_url) {
                $sttResult = $this->sttService->transcribeFromStorage($submission->audio_url, $this->audioService);
                if ($sttResult !== null) {
                    $transcript = $sttResult['text'];
                    // Persist transcript back to submission.
                    $submission->update(['transcript' => $transcript]);
                }
            }

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
                'job_id' => $job->id,
                'submission_type' => $job->submission_type,
                'submission_id' => $job->submission_id,
                'version' => $version + 1,
                'is_active' => true,
                'rubric_scores' => [
                    'fluency' => 3.0, 'pronunciation' => 2.5,
                    'content' => 3.0, 'vocab' => 2.5, 'grammar' => 2.5,
                ],
                'overall_band' => 5.0,
                'strengths' => ['Good fluency', 'Clear pronunciation'],
                'improvements' => [
                    ['message' => 'Expand vocabulary', 'explanation' => 'Use more varied expressions'],
                ],
                'pronunciation_report' => $sttResult ? ['accuracy_score' => (int) ($sttResult['confidence'] * 100)] : ['accuracy_score' => 0],
                'transcript' => $transcript,
            ]);

            $job->update(['status' => 'ready', 'completed_at' => now()]);
        });
    }

    private function loadSpeakingSubmission(GradingJob $job): ?PracticeSpeakingSubmission
    {
        if ($job->submission_type === 'practice_speaking') {
            return PracticeSpeakingSubmission::query()->find($job->submission_id);
        }

        return null;
    }
}
