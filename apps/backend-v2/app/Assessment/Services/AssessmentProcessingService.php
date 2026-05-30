<?php

declare(strict_types=1);

namespace App\Assessment\Services;

use App\Assessment\Data\AssessmentInput;
use App\Assessment\Data\EvidenceBag;
use App\Assessment\Data\EvidenceValidationResult;
use App\Assessment\Data\FeedbackBag;
use App\Assessment\Data\ScoreBag;
use App\Assessment\Data\SignalBag;
use App\Assessment\Enums\AssessmentJobStatus;
use App\Models\AssessmentAttempt;
use App\Models\AssessmentEvidence;
use App\Models\AssessmentJob;
use App\Models\AssessmentResult;
use Illuminate\Support\Facades\DB;
use Throwable;

final readonly class AssessmentProcessingService
{
    public function __construct(
        private StrategyRegistry $strategies,
    ) {}

    public function process(AssessmentJob $job): AssessmentResult
    {
        $job->loadMissing('attempt.rubric');

        try {
            $job->update([
                'status' => AssessmentJobStatus::Processing,
                'attempts' => $job->attempts + 1,
                'progress' => ['stage' => 'processing'],
                'started_at' => now(),
                'last_error' => null,
            ]);

            /** @var AssessmentAttempt $attempt */
            $attempt = $job->attempt;
            $rubric = $attempt->rubric;
            $input = $this->inputFromAttempt($attempt);
            $strategy = $this->strategies->for($attempt->task_type);

            $signals = $strategy->collectSignals($input);
            $evidence = $strategy->extractEvidence($input, $signals, $rubric);
            $validation = $strategy->validateEvidence($evidence, $rubric);

            if (! $validation->passed) {
                throw new \RuntimeException('Assessment evidence validation failed: '.implode('; ', $validation->errors));
            }

            $scores = $strategy->score($evidence, $signals, $rubric);
            $feedback = $strategy->buildFeedback($scores, $evidence, $signals);

            return DB::transaction(function () use ($attempt, $rubric, $job, $signals, $evidence, $validation, $scores, $feedback): AssessmentResult {
                AssessmentEvidence::updateOrCreate(
                    ['attempt_id' => $attempt->id],
                    [
                        'rubric_id' => $rubric->id,
                        'signals' => $this->signalArray($signals),
                        'evidence' => $this->evidenceArray($evidence),
                        'validation' => $this->validationArray($validation),
                        'extraction_trace' => ['strategy' => $attempt->task_type->value],
                    ],
                );

                $result = AssessmentResult::updateOrCreate(
                    ['attempt_id' => $attempt->id],
                    [
                        'rubric_id' => $rubric->id,
                        'criterion_scores' => $this->scoreArray($scores),
                        'overall_band' => $scores->overallBand,
                        'caps_applied' => $scores->capsApplied,
                        'calculation_trace' => $scores->calculationTrace,
                        'feedback' => $this->feedbackArray($feedback),
                    ],
                );

                $job->update([
                    'status' => AssessmentJobStatus::Ready,
                    'progress' => ['stage' => 'completed'],
                    'completed_at' => now(),
                ]);

                return $result;
            });
        } catch (Throwable $exception) {
            $job->update([
                'status' => AssessmentJobStatus::Failed,
                'progress' => ['stage' => 'failed'],
                'last_error' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }

    private function inputFromAttempt(AssessmentAttempt $attempt): AssessmentInput
    {
        $response = $attempt->response_payload;

        return new AssessmentInput(
            profileId: $attempt->profile_id,
            skill: $attempt->skill,
            taskType: $attempt->task_type,
            sourceType: $attempt->source_type,
            sourceId: $attempt->source_id,
            prompt: $attempt->prompt,
            requirements: $attempt->prompt['requirements'] ?? [],
            text: $response['text'] ?? null,
            audioUrl: $response['audio_url'] ?? null,
            metadata: $response['metadata'] ?? [],
        );
    }

    /** @return array<string,mixed> */
    private function signalArray(SignalBag $signals): array
    {
        return get_object_vars($signals);
    }

    /** @return array<string,mixed> */
    private function evidenceArray(EvidenceBag $evidence): array
    {
        return get_object_vars($evidence);
    }

    /** @return array<string,mixed> */
    private function validationArray(EvidenceValidationResult $validation): array
    {
        return get_object_vars($validation);
    }

    /** @return array<string,mixed> */
    private function feedbackArray(FeedbackBag $feedback): array
    {
        return get_object_vars($feedback);
    }

    /** @return list<array<string,mixed>> */
    private function scoreArray(ScoreBag $scores): array
    {
        return array_map(fn ($criterionScore): array => [
            'key' => $criterionScore->key->value,
            'score' => $criterionScore->score,
            'weight' => $criterionScore->weight,
            'evidence_used' => $criterionScore->evidenceUsed,
            'trace' => $criterionScore->trace,
        ], $scores->criterionScores);
    }
}
